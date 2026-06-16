import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Empty,
  Spin,
  message,
  Space,
  Popconfirm,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { layoutsApi, exportApi } from '../api/layouts';
import type { ResumeLayout } from '../api/layouts';

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

const { Title, Text } = Typography;

const MyLayoutsPage: React.FC = () => {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState<ResumeLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const fetchLayouts = async () => {
    try {
      const res = await layoutsApi.getList();
      setLayouts(res.data || []);
    } catch {
      message.error('加载布局列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await layoutsApi.delete(id);
      message.success('已删除');
      fetchLayouts();
    } catch {
      message.error('删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (layout: ResumeLayout) => {
    setExportingId(layout.id);
    try {
      const res = await exportApi.generateResume(layout.id);
      const blob = new Blob([res as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `简历_${layout.name}_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('导出成功');
    } catch (err: any) {
      const errMsg = await extractErrorMsg(err);
      message.error(errMsg || '导出失败，请确保有日常记录数据');
    } finally {
      setExportingId(null);
    }
  };

  const countByType = (puckData: any) => {
    if (!puckData?.content) return 0;
    return puckData.content.filter((c: any) => c.type === 'ExperienceList').length;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            我的布局
          </Title>
          <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: 4 }}>
            共 {layouts.length} 个布局 · 点击编辑
          </div>
        </div>
        <Space>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate('/templates')}>
            模板市场
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/editor')}
          >
            新建布局
          </Button>
        </Space>
      </div>

      {layouts.length === 0 ? (
        <Card>
          <Empty
            description="还没有保存的布局，去模板市场选择一个或从零创建"
            style={{ padding: '60px 0' }}
          >
            <Space>
              <Button type="primary" onClick={() => navigate('/templates')}>
                前往模板市场
              </Button>
              <Button onClick={() => navigate('/editor')}>从零创建</Button>
            </Space>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {layouts.map((layout) => (
            <Col key={layout.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate(`/editor?id=${layout.id}`)}
                actions={[
                  <EditOutlined
                    key="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/editor?id=${layout.id}`);
                    }}
                  />,
                  <DownloadOutlined
                    key="export"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(layout);
                    }}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定删除此布局？"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDelete(layout.id);
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <DeleteOutlined
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={layout.name}
                  description={
                    <div>
                      <Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          📅 {new Date(layout.updatedAt).toLocaleDateString('zh-CN')}
                        </Text>
                        {layout.templateId && (
                          <Tag color="blue" style={{ fontSize: 10 }}>来自模板</Tag>
                        )}
                      </Space>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {layout.layoutData?.puckData?.content?.length || 0} 个组件 ·{' '}
                          {countByType(layout.layoutData?.puckData)} 个数据列表
                        </Text>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default MyLayoutsPage;
