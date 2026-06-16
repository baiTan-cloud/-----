import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Layout, Button, Input, Select, Typography, message, Spin,
  Space, Card, Tooltip, Popconfirm, InputNumber, Empty, Divider,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  SaveOutlined, ArrowLeftOutlined, EyeOutlined, EditOutlined,
} from '@ant-design/icons';
import { templatesApi } from '../api/layouts';
import { recordsApi } from '../api/records';
import request from '../api/request';
import { renderTemplate } from '../utils/templateRender';
import type { Template, TemplateSection } from '../api/layouts';
import type { DailyRecord } from '../api/records';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ========== 占位符元数据 ==========
const FIELD_META: Record<string, { label: string; fields: string[] }> = {
  personal: {
    label: '个人信息',
    fields: ['name', 'email', 'phone'],
  },
  project: {
    label: '项目经历',
    fields: ['title', 'role', 'orgName', 'whatDone', 'challenge', 'solution', 'outcome', 'skills', 'startDate', 'endDate', 'description'],
  },
  education: {
    label: '教育经历',
    fields: ['title', 'degree', 'orgName', 'major', 'gpa', 'startDate', 'endDate', 'description'],
  },
  internship: {
    label: '实习经历',
    fields: ['title', 'role', 'orgName', 'whatDone', 'outcome', 'skills', 'startDate', 'endDate', 'description'],
  },
  skill: {
    label: '技能',
    fields: ['title', 'skills', 'description'],
  },
  certification: {
    label: '证书',
    fields: ['title', 'orgName', 'description', 'startDate', 'endDate'],
  },
  other: {
    label: '其他',
    fields: ['title', 'description', 'skills', 'startDate', 'endDate'],
  },
};

const FIELD_LABEL: Record<string, string> = {
  name: '姓名', email: '邮箱', phone: '电话',
  title: '标题', role: '角色', orgName: '组织名称',
  whatDone: '做了什么', challenge: '难点', solution: '方案',
  outcome: '成果', skills: '技能', achievements: '成果列表',
  startDate: '开始日期', endDate: '结束日期', description: '描述',
  major: '专业', degree: '学位', gpa: 'GPA',
};

const BINDING_OPTIONS = [
  { label: '项目经历', value: 'project' },
  { label: '教育经历', value: 'education' },
  { label: '实习经历', value: 'internship' },
  { label: '技能', value: 'skill' },
  { label: '证书', value: 'certification' },
  { label: '竞赛经历', value: 'competition' },
  { label: '其他', value: 'other' },
];

let sectionIdCounter = 0;
function genSectionId(): string {
  return `sec_${Date.now()}_${++sectionIdCounter}`;
}

// ==================== 主页面 ====================

const TemplateEditorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 模板数据
  const [templateName, setTemplateName] = useState('');
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [wordTemplateKey, setWordTemplateKey] = useState('tech_blue.docx');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // 预览数据
  const [userData, setUserData] = useState<{ name?: string; email?: string; phone?: string } | undefined>();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [previewHtml, setPreviewHtml] = useState('');

  const previewRef = useRef<HTMLDivElement>(null);

  // 加载数据
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 并行加载：用户信息 + 记录 + 模板
        const [meRes, recordsRes] = await Promise.all([
          request.get<any, any>('/auth/me'),
          recordsApi.getList({ size: 100 }),
        ]);

        setUserData({ name: meRes.data?.name, email: meRes.data?.email, phone: meRes.data?.phone });
        setRecords(recordsRes.data?.records || []);

        if (editId) {
          const tplRes = await templatesApi.getById(editId);
          const tpl = tplRes.data;
          setTemplateName(tpl.name);
          setWordTemplateKey(tpl.wordTemplateKey || 'tech_blue.docx');
          setSections(tpl.sections?.length ? tpl.sections.sort((a, b) => a.sortOrder - b.sortOrder) : []);
          if (tpl.sections?.length) {
            setSelectedSectionId(tpl.sections[0].id);
          }
        } else {
          // 新建模板：创建默认 3 个节
          const defaults = createDefaultSections();
          setSections(defaults);
          setSelectedSectionId(defaults[0]?.id || null);
        }
      } catch (err: any) {
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editId]);

  // 更新预览
  useEffect(() => {
    if (sections.length > 0) {
      const { html } = renderTemplate(sections, userData, records);
      setPreviewHtml(html);
    } else {
      setPreviewHtml('');
    }
  }, [sections, userData, records]);

  // ========== 节操作 ==========

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  const handleSelectSection = (id: string) => {
    setSelectedSectionId(id);
  };

  const handleAddSection = (type: 'personal' | 'list', dataBinding?: string) => {
    const newSection: TemplateSection = {
      id: genSectionId(),
      type,
      label: type === 'personal' ? '个人信息' : '新节',
      dataBinding: dataBinding || (type === 'list' ? 'project' : undefined),
      sortOrder: sections.length,
      contentTemplate: type === 'personal' ? '{{name}} | {{email}}' : undefined,
      titleTemplate: type === 'list' ? '节标题' : undefined,
      itemTemplate: type === 'list' ? '{{title}}' : undefined,
      availableFields: type === 'personal'
        ? FIELD_META.personal.fields
        : FIELD_META[dataBinding || 'project']?.fields || FIELD_META.project.fields,
      style: type === 'personal'
        ? { textAlign: 'center', marginBottom: 16 }
        : { titleFontSize: 18, titleColor: '#1890ff', itemFontSize: 14, itemColor: '#333333', marginBottom: 12 },
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setSelectedSectionId(newSection.id);
  };

  const handleDeleteSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    if (selectedSectionId === id) {
      setSelectedSectionId(updated.length > 0 ? updated[0]?.id : null);
    }
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const updated = [...sections];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    updated.forEach((s, i) => (s.sortOrder = i));
    setSections(updated);
  };

  // ========== 节字段更新 ==========

  const updateSection = (id: string, updates: Partial<TemplateSection>) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  // ========== 保存 ==========

  const handleSave = async () => {
    if (!templateName.trim()) {
      message.warning('请输入模板名称');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: templateName,
        wordTemplateKey,
        tags: ['文案模板'],
        sections: sections.map((s, i) => ({ ...s, sortOrder: i })),
      };
      if (editId) {
        await templatesApi.update(editId, payload);
        message.success('模板已更新');
      } else {
        const res = await templatesApi.create(payload);
        navigate(`/template-editor?id=${res.data.id}`, { replace: true });
        message.success('模板已创建');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ========== 占位符插入 ==========

  const insertPlaceholder = (field: string) => {
    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) return;

    const placeholder = `{{${field}}}`;
    // 根据节类型决定插入到哪个模板字段
    if (section.type === 'personal') {
      updateSection(section.id, {
        contentTemplate: (section.contentTemplate || '') + placeholder,
      });
    } else {
      // list 类型：插入到 itemTemplate
      updateSection(section.id, {
        itemTemplate: (section.itemTemplate || '') + placeholder,
      });
    }
  };

  // ========== 渲染 ==========

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  const availableFields = selectedSection
    ? (selectedSection.type === 'personal'
        ? FIELD_META.personal.fields
        : FIELD_META[selectedSection.dataBinding || 'project']?.fields || FIELD_META.project.fields)
    : [];

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* ===== Header ===== */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        background: '#fff', borderBottom: '1px solid #f0f0f0', gap: 12, flexShrink: 0,
      }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/templates')} />
        <Input
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          style={{ width: 240, fontSize: 16, fontWeight: 600, border: 'none', boxShadow: 'none' }}
          bordered={false}
          placeholder="模板名称"
        />
        <Select
          value={wordTemplateKey}
          onChange={setWordTemplateKey}
          style={{ width: 160 }}
          options={[
            { label: '简约科技蓝', value: 'tech_blue.docx' },
            { label: '学术简洁', value: 'simple_elegant.docx' },
            { label: '现代双栏', value: 'modern_dual.docx' },
          ]}
        />
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
          保存模板
        </Button>
      </div>

      {/* ===== 主体：三区域 ===== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 左侧：节列表 */}
        <div style={{
          width: 220, borderRight: '1px solid #f0f0f0', background: '#fafafa',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{ padding: '12px 12px 4px', fontWeight: 600, fontSize: 14, color: '#595959' }}>
            模板节
            <span style={{ fontWeight: 400, fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>
              ({sections.length})
            </span>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}>
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => handleSelectSection(sec.id)}
                style={{
                  padding: '8px 10px', marginBottom: 2, borderRadius: 6, cursor: 'pointer',
                  background: selectedSectionId === sec.id ? '#e6f7ff' : 'transparent',
                  border: selectedSectionId === sec.id ? '1px solid #91d5ff' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: sec.type === 'personal' ? '#1890ff' : '#52c41a',
                }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sec.label || '未命名节'}
                </span>
                <Space size={2}>
                  <Tooltip title="上移">
                    <Button type="text" size="small" icon={<ArrowUpOutlined />}
                      disabled={idx === 0}
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(sec.id, 'up'); }} />
                  </Tooltip>
                  <Tooltip title="下移">
                    <Button type="text" size="small" icon={<ArrowDownOutlined />}
                      disabled={idx === sections.length - 1}
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(sec.id, 'down'); }} />
                  </Tooltip>
                  <Popconfirm title="删除此节？" onConfirm={(e) => { e?.stopPropagation(); handleDeleteSection(sec.id); }}
                    onCancel={(e) => e?.stopPropagation()}>
                    <Tooltip title="删除">
                      <Button type="text" size="small" danger icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()} />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              </div>
            ))}
          </div>

          <div style={{ padding: 8, borderTop: '1px solid #f0f0f0' }}>
            <Button block size="small" icon={<PlusOutlined />}
              onClick={() => handleAddSection('personal')}>
              添加个人信息节
            </Button>
            <div style={{ height: 4 }} />
            <Select
              placeholder="添加列表节..."
              style={{ width: '100%' }}
              size="small"
              onChange={(val) => handleAddSection('list', val)}
              options={BINDING_OPTIONS.map(o => ({ label: `+ ${o.label}`, value: o.value }))}
            />
          </div>
        </div>

        {/* 中间：节编辑器 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#fff' }}>
          {!selectedSection ? (
            <Empty description="请选择一个模板节进行编辑" />
          ) : (
            <SectionEditor
              section={selectedSection}
              onChange={(updates) => updateSection(selectedSection.id, updates)}
              availableFields={availableFields}
              onInsertPlaceholder={insertPlaceholder}
            />
          )}
        </div>

        {/* 右侧：预览 */}
        <div style={{
          width: 400, borderLeft: '1px solid #f0f0f0', background: '#f5f5f5',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{
            padding: '8px 12px', fontWeight: 600, fontSize: 13, color: '#595959',
            borderBottom: '1px solid #f0f0f0', background: '#fff', flexShrink: 0,
          }}>
            <EyeOutlined style={{ marginRight: 6 }} />
            实时预览
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            <div
              ref={previewRef}
              style={{
                background: '#fff', padding: 24, minHeight: 400,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderRadius: 4,
                fontSize: 14, lineHeight: 1.6, color: '#333',
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml || '<div style="color:#bbb;text-align:center;padding:60px 0">暂无预览内容</div>' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 节编辑器子组件 ====================

interface SectionEditorProps {
  section: TemplateSection;
  onChange: (updates: Partial<TemplateSection>) => void;
  availableFields: string[];
  onInsertPlaceholder: (field: string) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ section, onChange, availableFields, onInsertPlaceholder }) => {

  const renderStyleEditor = () => (
    <div>
      <Text strong style={{ fontSize: 13 }}>样式</Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>字号</Text>
          <InputNumber
            size="small" style={{ width: '100%' }} min={8} max={72}
            value={section.style?.itemFontSize || section.style?.titleFontSize || 14}
            onChange={(val) => {
              const key = section.type === 'personal' ? 'fontSize' : (section.type === 'list' ? 'titleFontSize' : 'fontSize');
              onChange({ style: { ...section.style, [key]: val } });
            }}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>颜色</Text>
          <input
            type="color"
            value={section.style?.itemColor || section.style?.titleColor || '#333333'}
            onChange={(e) => {
              const key = section.type === 'list' ? 'titleColor' : 'color';
              onChange({ style: { ...section.style, [key]: e.target.value } });
            }}
            style={{ width: 36, height: 32, padding: 0, border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer', display: 'block' }}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>对齐</Text>
          <Select
            size="small" style={{ width: 80 }}
            value={section.style?.textAlign || 'left'}
            onChange={(val) => onChange({ style: { ...section.style, textAlign: val } })}
            options={[
              { label: '左', value: 'left' },
              { label: '中', value: 'center' },
              { label: '右', value: 'right' },
            ]}
          />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 11 }}>下间距</Text>
          <InputNumber
            size="small" style={{ width: '100%' }} min={0} max={60}
            value={section.style?.marginBottom || 12}
            onChange={(val) => onChange({ style: { ...section.style, marginBottom: val } })}
          />
        </div>
      </div>
    </div>
  );

  const renderPlaceholderButtons = () => (
    <div style={{ marginBottom: 12 }}>
      <Text type="secondary" style={{ fontSize: 11 }}>可用占位符：点击插入到模板中</Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
        {availableFields.map(field => (
          <Button
            key={field}
            size="small"
            type="dashed"
            onClick={() => onInsertPlaceholder(field)}
            style={{ fontSize: 11 }}
          >
            {`{{${field}}}`}
            <span style={{ color: '#8c8c8c', marginLeft: 2, fontSize: 10 }}>
              {FIELD_LABEL[field] || field}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );

  if (section.type === 'personal') {
    return (
      <div>
        <Title level={5} style={{ margin: '0 0 4px' }}>{section.label || '个人信息'}</Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
          个人信息节从用户数据获取值填充占位符
        </Text>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>节名称</Text>
          <Input
            size="small" style={{ marginTop: 4 }}
            value={section.label}
            onChange={e => onChange({ label: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>内容模板</Text>
          <div style={{ fontSize: 12, color: '#8c8c8c', margin: '4px 0' }}>
            用 {'{{占位符}}'} 定义个人信息显示格式
          </div>
          <TextArea
            rows={3}
            value={section.contentTemplate}
            onChange={e => onChange({ contentTemplate: e.target.value })}
            placeholder="例如：{{name}} | {{email}}  |  {{phone}}"
          />
        </div>

        {renderPlaceholderButtons()}

        <Divider />
        {renderStyleEditor()}
      </div>
    );
  }

  if (section.type === 'list') {
    const bindingLabel = BINDING_OPTIONS.find(o => o.value === section.dataBinding)?.label || section.dataBinding;

    return (
      <div>
        <Title level={5} style={{ margin: '0 0 4px' }}>{section.label || '列表节'}</Title>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
          列表节绑定到「{bindingLabel}」记录，每条记录循环渲染
        </Text>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>节名称</Text>
          <Input
            size="small" style={{ marginTop: 4 }}
            value={section.label}
            onChange={e => onChange({ label: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>数据绑定</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={section.dataBinding}
            onChange={(val) => onChange({ dataBinding: val })}
            options={BINDING_OPTIONS}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>节标题模板</Text>
          <Input
            size="small" style={{ marginTop: 4 }}
            value={section.titleTemplate}
            onChange={e => onChange({ titleTemplate: e.target.value })}
            placeholder="例如：项目经历"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>每条记录渲染模板</Text>
          <div style={{ fontSize: 12, color: '#8c8c8c', margin: '4px 0' }}>
            用 {'{{占位符}}'} 定义每条记录的显示格式
          </div>
          <TextArea
            rows={4}
            value={section.itemTemplate}
            onChange={e => onChange({ itemTemplate: e.target.value })}
            placeholder="例如：作为{{role}}，主导了{{title}}的{{whatDone}}，最终{{outcome}}。"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13 }}>详情模板（可选）</Text>
          <div style={{ fontSize: 12, color: '#8c8c8c', margin: '4px 0' }}>
            显示在内容模板下方，用于展示技术栈等信息
          </div>
          <Input
            size="small" style={{ marginTop: 4 }}
            value={section.detailTemplate}
            onChange={e => onChange({ detailTemplate: e.target.value })}
            placeholder="例如：技术栈：{{skills}}"
          />
        </div>

        {renderPlaceholderButtons()}

        <Divider />
        {renderStyleEditor()}
      </div>
    );
  }

  return null;
};

// ==================== 默认节 ====================

function createDefaultSections(): TemplateSection[] {
  return [
    {
      id: genSectionId(),
      type: 'personal',
      label: '个人信息',
      sortOrder: 0,
      contentTemplate: '{{name}} | {{email}}',
      availableFields: FIELD_META.personal.fields,
      style: { textAlign: 'center', titleFontSize: 22, titleColor: '#1890ff', marginBottom: 16 },
    },
    {
      id: genSectionId(),
      type: 'list',
      label: '项目经历',
      dataBinding: 'project',
      sortOrder: 1,
      titleTemplate: '项目经历',
      itemTemplate: '作为{{role}}，主导了{{title}}的{{whatDone}}。针对{{challenge}}，采用{{solution}}方案，最终{{outcome}}。',
      detailTemplate: '技术栈：{{skills}}',
      availableFields: FIELD_META.project.fields,
      style: { titleFontSize: 18, titleColor: '#1890ff', itemFontSize: 14, itemColor: '#333333', marginBottom: 12 },
    },
    {
      id: genSectionId(),
      type: 'list',
      label: '教育经历',
      dataBinding: 'education',
      sortOrder: 2,
      titleTemplate: '教育经历',
      itemTemplate: '{{degree}} · {{orgName}} · {{major}}',
      detailTemplate: 'GPA：{{gpa}}',
      availableFields: FIELD_META.education.fields,
      style: { titleFontSize: 18, titleColor: '#1890ff', itemFontSize: 14, itemColor: '#333333', marginBottom: 12 },
    },
  ];
}

export default TemplateEditorPage;
