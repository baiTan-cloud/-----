import React, { useState, useEffect, Component, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, message, Spin, Tooltip, Alert } from 'antd';
import { SaveOutlined, DownloadOutlined, ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import config from '../puck.config';
import { layoutsApi, templatesApi, exportApi } from '../api/layouts';
import type { PuckData } from '../api/layouts';

/** 空布局 */
const EMPTY_PUCK_DATA: PuckData = {
  root: { props: {} },
  content: [],
};

/** 创建带默认组件的初始数据，防止低版本 Puck 空画布时 @dnd-kit CollisionObserver 崩溃 */
function createDefaultPuckData(): PuckData {
  return {
    root: { props: {} },
    content: [
      {
        type: 'HeadingBlock',
        props: {
          text: '点击编辑标题',
          fontSize: 26,
          bold: 'yes',
          color: '#262626',
          bgColor: 'transparent',
          textAlign: 'center',
          letterSpacing: 0,
          paddingY: 12,
          binding: 'user.name',
        },
        id: crypto.randomUUID(),
      },
    ],
  };
}

/** 错误边界 - 防止 Puck 崩溃导致白屏 */
class PuckErrorBoundary extends Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Alert
            type="error"
            showIcon
            message="编辑器渲染异常"
            description={(this.state.error as unknown as Error)?.message || '组件拖拽时发生未知错误，请重置编辑器'}
            action={
              <Button
                key="reset"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onReset();
                }}
              >
                重置编辑器
              </Button>
            }
          />
        </div>
      );
    }
    return this.props.children;
  }
}

/** 从 blob 错误响应中提取错误消息 */
async function extractErrorMsg(err: any): Promise<string | null> {
  if (err?.response?.data instanceof Blob) {
    try {
      const text = await err.response.data.text();
      const json = JSON.parse(text);
      return json.message || json.error || null;
    } catch {
      return null;
    }
  }
  return err?.response?.data?.message || err?.message || null;
}

const EditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const layoutId = searchParams.get('id');
  const templateId = searchParams.get('template');

  const [puckData, setPuckData] = useState<PuckData>(EMPTY_PUCK_DATA);
  const [initialData, setInitialData] = useState<PuckData | undefined>(undefined);
  const [layoutName, setLayoutName] = useState('未命名布局');
  const [savedLayoutId, setSavedLayoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // 加载布局（仅执行一次，设置 initialData 后不再变更）
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (layoutId) {
          // 加载已有布局
          const res = await layoutsApi.getById(layoutId);
          const layout = res.data;
          if (cancelled) return;
          setLayoutName(layout.name);
          setSavedLayoutId(layout.id);
          const loaded = layout.layoutData?.puckData || EMPTY_PUCK_DATA;
          setPuckData(loaded);
          setInitialData(loaded);
        } else if (templateId) {
          // 从模板创建新布局
          const res = await templatesApi.useTemplate(templateId);
          const layout = res.data;
          if (cancelled) return;
          setLayoutName(layout.name);
          setSavedLayoutId(layout.id);
          const loaded = layout.layoutData?.puckData || EMPTY_PUCK_DATA;
          setPuckData(loaded);
          setInitialData(loaded);
          navigate(`/editor?id=${layout.id}`, { replace: true });
        } else {
          // 从零创建（带默认组件，避免拖拽崩溃）
          if (cancelled) return;
          const fresh = createDefaultPuckData();
          setPuckData(fresh);
          setInitialData(fresh);
        }
      } catch (err: any) {
        if (cancelled) return;
        message.error(err?.response?.data?.message || '加载失败');
        const fresh = createDefaultPuckData();
        setPuckData(fresh);
        setInitialData(fresh);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [layoutId, templateId, navigate]);

  // 保存布局
  const doSave = async (name: string) => {
    setSaving(true);
    try {
      const layoutData = { puckData };
      if (savedLayoutId) {
        await layoutsApi.update(savedLayoutId, name, layoutData);
        message.success('布局已更新');
      } else {
        const res = await layoutsApi.create(name, layoutData);
        setSavedLayoutId(res.data.id);
        navigate(`/editor?id=${res.data.id}`, { replace: true });
        message.success('布局已保存');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 导出简历
  const doExport = async () => {
    if (!savedLayoutId) {
      message.warning('请先保存布局再导出');
      setPendingSave(true);
      return;
    }
    setExporting(true);
    try {
      const res = await exportApi.generateResume(savedLayoutId);
      const blob = new Blob([res as any], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `简历_${layoutName}_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('简历导出成功');
    } catch (err: any) {
      const errMsg = await extractErrorMsg(err);
      message.error(errMsg || '导出失败，请确保有日常记录数据');
    } finally {
      setExporting(false);
    }
  };

  // 未保存时先保存再导出
  useEffect(() => {
    if (pendingSave && savedLayoutId) {
      setPendingSave(false);
      doExport();
    }
  }, [pendingSave, savedLayoutId]);

  if (loading || initialData === undefined) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <Spin size="large" tip="加载布局..." />
      </div>
    );
  }

  const handleReset = () => {
    const fresh = createDefaultPuckData();
    setPuckData(fresh);
    setInitialData(fresh);
    setResetKey((k) => k + 1);
  };

  return (
    <PuckErrorBoundary onReset={handleReset}>
      <Puck
        key={resetKey}
        config={config}
        data={initialData}
        onChange={(data: any) =>
          setPuckData({ root: data.root, content: data.content })
        }
        renderHeader={() => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              height: 56,
              borderBottom: '1px solid #f0f0f0',
              background: '#fff',
              gap: 8,
            }}
          >
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/my-layouts')}
            />
            <Input
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              style={{
                width: 220,
                fontSize: 16,
                fontWeight: 600,
                border: 'none',
                boxShadow: 'none',
              }}
              bordered={false}
            />
            <span style={{ fontSize: 12, color: '#8c8c8c', marginRight: 'auto' }}>
              {puckData.content.length} 个组件
              {savedLayoutId ? ' · 已保存' : ' · 未保存'}
            </span>
            <Button
              icon={<SaveOutlined />}
              onClick={() => doSave(layoutName)}
              loading={saving}
            >
              保存布局
            </Button>
            <Tooltip title={!savedLayoutId ? '请先保存布局' : '一键导出 Word 简历'}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={doExport}
                loading={exporting}
              >
                导出 Word
              </Button>
            </Tooltip>
          </div>
        )}
      />
    </PuckErrorBoundary>
  );
};

export default EditorPage;
