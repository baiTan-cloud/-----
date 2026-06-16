import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Empty,
  Modal,
  Form,
  message,
  Spin,
  List,
  Pagination,
  Timeline,
  Drawer,
  DatePicker,
  Table,
  Checkbox,
  Tabs,
  Upload,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  DownOutlined,
  RightOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { recordsApi, DailyRecord, RecordEntry, analysisApi } from '../api/records';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const typeConfig: Record<string, { color: string; label: string; icon: string }> = {
  project: { color: 'blue', label: '项目', icon: '📁' },
  internship: { color: 'orange', label: '实习', icon: '💼' },
  competition: { color: 'green', label: '竞赛', icon: '🏅' },
  skill: { color: 'purple', label: '技能', icon: '📜' },
  certification: { color: 'cyan', label: '证书', icon: '🎓' },
  education: { color: 'geekblue', label: '教育', icon: '🎓' },
  other: { color: 'default', label: '其他', icon: '📌' },
};

const TYPE_OPTIONS = [
  { label: '📁 项目', value: 'project' },
  { label: '💼 实习', value: 'internship' },
  { label: '🏅 竞赛', value: 'competition' },
  { label: '🎓 教育', value: 'education' },
  { label: '📜 技能', value: 'skill' },
  { label: '🎓 证书', value: 'certification' },
  { label: '📌 其他', value: 'other' },
];

/** 关键词高亮 */
function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword || !text) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ background: '#ffd666', padding: '0 2px', borderRadius: 2 }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

type ViewMode = 'card' | 'table';

const RecordsPage: React.FC = () => {
  // ---- 数据 ----
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // ---- 多选 ----
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ---- 编辑 ----
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  // ---- 展开 ----
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ---- 条目 ----
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryTargetId, setEntryTargetId] = useState<string | null>(null);
  const [entryForm] = Form.useForm();

  // ---- 快速录入 ----
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickForm] = Form.useForm();

  // ---- 导出 ----
  const [exporting, setExporting] = useState(false);

  // ---- 导入 ----
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);

  // ---- 统计面板 ----
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState<{
    totalRecords: number;
    typeDistribution: Record<string, number>;
    monthlyTrend: Record<string, number>;
    skillFrequency: Record<string, number>;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ==================== 数据获取 ====================

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recordsApi.getList({
        page: page - 1,
        size: 10,
        type: typeFilter,
        keyword: keyword || undefined,
      });
      setRecords(res.data.records || []);
      setTotal(res.data.total || 0);
      setSelectedIds([]);
    } catch {
      message.error('加载记录失败');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, keyword]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await analysisApi.getStats();
      setStats(res.data);
    } catch {
      message.error('加载统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (statsOpen && !stats) loadStats();
  }, [statsOpen]);

  // ==================== 操作 ====================

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openCreateDrawer = () => {
    setEditingId(null);
    editForm.resetFields();
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: DailyRecord) => {
    setEditingId(record.id);
    editForm.setFieldsValue({
      title: record.title,
      type: record.type,
      startDate: record.startDate ? (window as any).dayjs?.(record.startDate) : undefined,
      endDate: record.endDate ? (window as any).dayjs?.(record.endDate) : undefined,
      description: record.description,
      achievements: record.achievements,
      skills: record.skills,
      link: record.link,
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await recordsApi.delete(id);
      message.success('已删除');
      fetchRecords();
    } catch {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await recordsApi.batchDelete(selectedIds);
      message.success(`已删除 ${selectedIds.length} 条记录`);
      fetchRecords();
    } catch {
      message.error('批量删除失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await editForm.validateFields();
      // 处理日期格式
      const payload = {
        ...values,
        startDate: values.startDate?.toISOString?.() || values.startDate || null,
        endDate: values.endDate?.toISOString?.() || values.endDate || null,
      };
      setSaving(true);
      if (editingId) {
        await recordsApi.update(editingId, payload);
        message.success('已更新');
      } else {
        await recordsApi.create(payload);
        message.success('已创建');
      }
      setDrawerOpen(false);
      fetchRecords();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ---- 条目 ----

  const handleAddEntry = (recordId: string) => {
    setEntryTargetId(recordId);
    entryForm.resetFields();
    setEntryModalOpen(true);
  };

  const handleSaveEntry = async () => {
    try {
      const values = await entryForm.validateFields();
      if (!entryTargetId) return;
      setSaving(true);

      const record = records.find((r) => r.id === entryTargetId);
      if (!record) { message.error('记录不存在'); return; }

      const newEntry: RecordEntry = {
        date: values.date || undefined,
        description: values.description,
        achievements: values.achievements || [],
        skills: values.skills || [],
      };

      await recordsApi.update(entryTargetId, {
        ...record,
        entries: [...(record.entries || []), newEntry],
      } as any);

      message.success('条目已添加');
      setEntryModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (recordId: string, entryIdx: number) => {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
    const updatedEntries = [...(record.entries || [])];
    updatedEntries.splice(entryIdx, 1);
    try {
      await recordsApi.update(recordId, { ...record, entries: updatedEntries } as any);
      message.success('条目已删除');
      fetchRecords();
    } catch {
      message.error('删除失败');
    }
  };

  // ---- 快速录入 ----

  const handleQuickSave = async () => {
    try {
      const values = await quickForm.validateFields();
      setSaving(true);
      const { date, ...rest } = values;
      await recordsApi.create({
        ...rest,
        startDate: date?.toISOString?.() || date || null,
        whatDone: rest.whatDone || undefined,
        outcome: rest.outcome || undefined,
      });
      message.success('已记录');
      setQuickModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ---- 导出 ----

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const res = await recordsApi.exportRecords({ type: typeFilter, format });
      const blob = new Blob([res as any], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `records_export_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  // ---- 导入 ----

  const handleImport = async () => {
    if (!importJson.trim()) return;
    setImporting(true);
    try {
      const data = JSON.parse(importJson);
      const arr = Array.isArray(data) ? data : [data];
      const res = await recordsApi.importRecords(arr);
      message.success(`成功导入 ${res.data} 条记录`);
      setImportModalOpen(false);
      setImportJson('');
      fetchRecords();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '导入失败，请检查 JSON 格式');
    } finally {
      setImporting(false);
    }
  };

  // ==================== 计算属性 ====================

  const keywordLower = keyword.toLowerCase();

  const typeColors: Record<string, string> = {
    project: '#e6f7ff',
    internship: '#fff7e6',
    competition: '#f6ffed',
    certification: '#f9f0ff',
  };

  // ==================== 渲染 ====================

  const renderTimeline = (record: DailyRecord) => (
    <div onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#8c8c8c' }}>
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          时间线
        </span>
        <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => handleAddEntry(record.id)}>
          添加条目
        </Button>
      </div>

      {(record.entries?.length ?? 0) === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#bfbfbf', fontSize: 13 }}>
          暂无时间线条目，点击"添加条目"记录每次的进展
        </div>
      ) : (
        <Timeline
          items={record.entries?.map((entry, idx) => ({
            color: 'blue',
            children: (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {entry.date ? new Date(entry.date).toLocaleDateString('zh-CN') : '未记录日期'}
                  </span>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />}
                    onClick={() => handleDeleteEntry(record.id, idx)} />
                </div>
                <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.6 }}>
                  {keyword ? highlightText(entry.description, keyword) : entry.description}
                </div>
                {entry.achievements && entry.achievements.length > 0 && (
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, fontSize: 13, color: '#595959' }}>
                    {entry.achievements.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
                {entry.skills && entry.skills.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {entry.skills.map((s) => (
                      <Tag key={s} color="blue" style={{ fontSize: 11, marginBottom: 2 }}>{s}</Tag>
                    ))}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      )}
    </div>
  );

  const renderCardItem = (record: DailyRecord) => {
    const entryCount = record.entries?.length || 0;
    const isExpanded = expandedId === record.id;
    return (
      <Card
        key={record.id}
        style={{ marginBottom: 12 }}
        hoverable
        size="small"
      >
        <div style={{ display: 'flex', gap: 12 }} onClick={() => toggleExpand(record.id)}>
          {/* Checkbox */}
          <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: 10 }}>
            <Checkbox
              checked={selectedIds.includes(record.id)}
              onChange={(e) => {
                setSelectedIds((prev) =>
                  e.target.checked
                    ? [...prev, record.id]
                    : prev.filter((id) => id !== record.id)
                );
              }}
            />
          </div>

          {/* Icon */}
          <div
            style={{
              width: 36, height: 36, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
              background: typeColors[record.type] || '#f5f5f5',
            }}
          >
            {typeConfig[record.type]?.icon || '📌'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {keyword ? highlightText(record.title, keyword) : record.title}
              <Tag color={typeConfig[record.type]?.color} style={{ marginRight: 0 }}>
                {typeConfig[record.type]?.label || record.type}
              </Tag>
              {entryCount > 0 && (
                <Tag icon={<HistoryOutlined />} color="default" style={{ fontSize: 11 }}>
                  {entryCount} 条记录
                </Tag>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#595959', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {keyword ? highlightText(record.description, keyword) : record.description}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {record.skills?.slice(0, 3).map((s) => (
                <Tag key={s} color="blue" style={{ fontSize: 11, marginRight: 0 }}>{s}</Tag>
              ))}
              {record.skills && record.skills.length > 3 && (
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>+{record.skills.length - 3}</span>
              )}
              <span style={{ fontSize: 12, color: '#bfbfbf', marginLeft: 'auto' }}>
                {record.startDate ? new Date(record.startDate).toLocaleDateString('zh-CN') : ''}
                {record.startDate && record.endDate ? ' - ' : ''}
                {record.endDate ? new Date(record.endDate).toLocaleDateString('zh-CN') : ''}
                <span style={{ marginLeft: 6 }}>{isExpanded ? <DownOutlined /> : <RightOutlined />}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}>
            <Tooltip title="编辑">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} />
            </Tooltip>
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} placement="left">
              <Tooltip title="删除">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </div>
        </div>

        {isExpanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            {renderTimeline(record)}
          </div>
        )}
      </Card>
    );
  };

  const tableColumns = [
    {
      title: <Checkbox checked={selectedIds.length === records.length && records.length > 0}
        onChange={(e) => setSelectedIds(e.target.checked ? records.map((r) => r.id) : [])} />,
      dataIndex: 'id',
      width: 40,
      render: (id: string) => (
        <Checkbox
          checked={selectedIds.includes(id)}
          onChange={(e) => setSelectedIds((prev) =>
            e.target.checked ? [...prev, id] : prev.filter((i) => i !== id)
          )}
        />
      ),
    },
    {
      title: '标题', dataIndex: 'title', key: 'title',
      render: (text: string, record: DailyRecord) => (
        <Space size={4}>
          <span>{typeConfig[record.type]?.icon} </span>
          <span style={{ fontWeight: 500 }}>{keyword ? highlightText(text, keyword) : text}</span>
          <Tag color={typeConfig[record.type]?.color} style={{ fontSize: 11 }}>
            {typeConfig[record.type]?.label}
          </Tag>
        </Space>
      ),
    },
    {
      title: '描述', dataIndex: 'description', key: 'description', ellipsis: true,
      render: (text: string) => keyword ? highlightText(text, keyword) : text,
    },
    {
      title: '技能', dataIndex: 'skills', key: 'skills', width: 200,
      render: (skills: string[]) => skills?.map((s) => <Tag key={s} color="blue" style={{ fontSize: 11, marginBottom: 2 }}>{s}</Tag>),
    },
    {
      title: '日期', key: 'date', width: 160,
      render: (_: any, record: DailyRecord) => (
        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
          {record.startDate ? new Date(record.startDate).toLocaleDateString('zh-CN') : ''}
          {record.startDate && record.endDate ? ' ~ ' : ''}
          {record.endDate ? new Date(record.endDate).toLocaleDateString('zh-CN') : ''}
        </span>
      ),
    },
    {
      title: '条目', dataIndex: 'entries', key: 'entries', width: 60, align: 'center' as const,
      render: (entries: RecordEntry[]) => entries?.length ? <Tag>{entries.length}</Tag> : '-',
    },
    {
      title: '', key: 'action', width: 80,
      render: (_: any, record: DailyRecord) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} />
          </Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== 主渲染 ====================

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>日常记录</Title>
          <Text type="secondary">管理你的履历素材，共 {total} 条记录</Text>
        </div>
        <Space>
          <Tooltip title="统计面板">
            <Button icon={<BarChartOutlined />} onClick={() => { setStatsOpen(!statsOpen); }} />
          </Tooltip>
          <Button icon={<DownloadOutlined />} onClick={() => handleExport('json')} loading={exporting}>
            导出
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
            导入
          </Button>
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => { quickForm.resetFields(); setQuickModalOpen(true); }}>
            快速记录
          </Button>
          <Button type="primary" ghost icon={<PlusOutlined />} onClick={openCreateDrawer}>
            添加记录
          </Button>
        </Space>
      </div>

      {/* 统计面板 */}
      {statsOpen && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Spin spinning={statsLoading}>
            {stats && (
              <Row gutter={24}>
                <Col span={4}>
                  <Statistic title="总记录数" value={stats.totalRecords} />
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>类型分布</div>
                  <Space wrap size={[4, 4]}>
                    {Object.entries(stats.typeDistribution).map(([type, count]) => (
                      <Tag key={type} color={typeConfig[type]?.color || 'default'}>
                        {typeConfig[type]?.label || type} × {count}
                      </Tag>
                    ))}
                  </Space>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>高频技能词（Top 20）</div>
                  <div style={{ maxHeight: 80, overflow: 'auto' }}>
                    <Space wrap size={[4, 4]}>
                      {Object.entries(stats.skillFrequency).slice(0, 20).map(([word, count]) => (
                        <Tag key={word} style={{ fontSize: count > 5 ? 14 : 12, fontWeight: count > 10 ? 700 : 400 }}>
                          {word} {count}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Col>
              </Row>
            )}
          </Spin>
        </Card>
      )}

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16, padding: '8px 0' }} bodyStyle={{ padding: '8px 16px' }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Input
              placeholder="搜索标题或描述..."
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => { setPage(1); fetchRecords(); }}
              allowClear
            />
            <Select
              placeholder="全部类型"
              style={{ width: 130 }}
              allowClear
              value={typeFilter}
              onChange={(val) => { setTypeFilter(val); setPage(1); }}
              options={[
                { label: '全部类型', value: undefined },
                ...TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
              ]}
            />
            {selectedIds.length > 0 && (
              <Popconfirm
                title={`确定删除选中的 ${selectedIds.length} 条记录？`}
                onConfirm={handleBatchDelete}
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  删除所选 ({selectedIds.length})
                </Button>
              </Popconfirm>
            )}
          </Space>

          <Space>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              size="small"
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
            />
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              size="small"
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('table')}
            />
          </Space>
        </Space>
      </Card>

      {/* 列表 */}
      <Spin spinning={loading}>
        {records.length === 0 && !loading ? (
          <Card>
            <Empty description="暂无日常记录，点击上方「添加记录」开始积累履历素材" style={{ padding: '60px 0' }}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>添加记录</Button>
                <Button icon={<ThunderboltOutlined />} onClick={() => setQuickModalOpen(true)}>快速记录</Button>
              </Space>
            </Empty>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {records.map(renderCardItem)}
            {total > 10 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination current={page} total={total} pageSize={10} onChange={(p) => setPage(p)} />
              </div>
            )}
          </>
        ) : (
          <>
            <Card size="small" bodyStyle={{ padding: 0 }}>
              <Table
                dataSource={records}
                columns={tableColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
            {total > 10 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination current={page} total={total} pageSize={10} onChange={(p) => setPage(p)} />
              </div>
            )}
          </>
        )}
      </Spin>

      {/* ============== Drawer：编辑 ============== */}
      <Drawer
        title={editingId ? '编辑记录' : '添加日常记录'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {editingId ? '保存修改' : '保存记录'}
            </Button>
          </Space>
        }
      >
        <Form form={editForm} layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Form.Item name="title" label="记录标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如：电商秒杀系统设计" />
          </Form.Item>

          <Form.Item name="type" label="记录类型" rules={[{ required: true }]} initialValue="project">
            <Select options={TYPE_OPTIONS} />
          </Form.Item>

          {/* 通用碎片化字段 */}
          <Form.Item name="role" label="角色">
            <Input placeholder="例如：后端负责人 / 项目经理" />
          </Form.Item>

          <Form.Item name="orgName" label="组织/公司/学校">
            <Input placeholder="例如：阿里巴巴 / 北京大学" />
          </Form.Item>

          <Form.Item name="whatDone" label="核心工作（一句话概括）">
            <TextArea rows={2} placeholder="例如：设计了高并发秒杀系统架构" />
          </Form.Item>

          <Form.Item name="outcome" label="成果（含量化指标）">
            <Input placeholder="例如：QPS提升至8000+，系统可用性99.99%" />
          </Form.Item>

          {/* type=project/internship 专有 */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type !== 'project' && type !== 'internship') return null;
              return (
                <>
                  <Form.Item name="challenge" label="难点挑战">
                    <Input placeholder="例如：库存超卖问题、高并发下数据一致性问题" />
                  </Form.Item>
                  <Form.Item name="solution" label="解决方案">
                    <Input placeholder="例如：采用Redis预减库存+Lua脚本方案" />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          {/* type=education 专有 */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type !== 'education') return null;
              return (
                <>
                  <Form.Item name="major" label="专业">
                    <Input placeholder="例如：计算机科学与技术" />
                  </Form.Item>
                  <Form.Item name="degree" label="学位">
                    <Select placeholder="选择学位"
                      options={[
                        { label: '博士', value: '博士' },
                        { label: '硕士', value: '硕士' },
                        { label: '本科', value: '本科' },
                        { label: '大专', value: '大专' },
                      ]} />
                  </Form.Item>
                  <Form.Item name="gpa" label="GPA">
                    <Input placeholder="例如：3.8/4.0" />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Form.Item name="startDate" label="开始时间">
            <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" />
          </Form.Item>

          <Form.Item name="endDate" label="结束时间">
            <DatePicker style={{ width: '100%' }} placeholder="选择结束日期" />
          </Form.Item>

          <Form.Item name="skills" label="技能标签">
            <Select mode="tags" placeholder="输入技能标签后回车" />
          </Form.Item>

          <Form.Item name="achievements" label="成果列表">
            <Select mode="tags" placeholder="输入成果后回车（例如：QPS提升至8000+）" />
          </Form.Item>

          <Form.Item name="description" label="详细描述（旧字段，选填）" tooltip="新记录建议使用上面的碎片化字段，此字段保留用于旧数据兼容">
            <TextArea rows={3} placeholder="可选：详细描述你的经历..." />
          </Form.Item>

          <Form.Item name="link" label="关联链接">
            <Input placeholder="GitHub 仓库 / 证书验证链接" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ============== 添加时间线条目 ============== */}
      <Modal
        title="添加时间线条目"
        open={entryModalOpen}
        onOk={handleSaveEntry}
        onCancel={() => setEntryModalOpen(false)}
        width={480}
        okText="添加"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={entryForm} layout="vertical" style={{ marginTop: 16 }} preserve={false}>
          <Form.Item name="date" label="日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="description" label="本次做了什么" rules={[{ required: true, message: '请描述本次进展' }]}>
            <TextArea rows={3} placeholder="描述本次完成了什么，遇到的难点，解决方案..." />
          </Form.Item>
          <Form.Item name="achievements" label="本次成果">
            <Select mode="tags" placeholder="输入成果后回车（如：QPS提升至8000+）" />
          </Form.Item>
          <Form.Item name="skills" label="本次用到的技能">
            <Select mode="tags" placeholder="输入技能标签" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============== 快速录入 ============== */}
      <Modal
        title="快速记录"
        open={quickModalOpen}
        onOk={handleQuickSave}
        onCancel={() => setQuickModalOpen(false)}
        width={480}
        okText="保存"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={quickForm} layout="vertical" style={{ marginTop: 16 }} preserve={false}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="今天做了什么？一句话概括..." />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="project">
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Input placeholder="你的角色" />
          </Form.Item>
          <Form.Item name="whatDone" label="做了什么">
            <Input placeholder="一句话概括核心工作" />
          </Form.Item>
          <Form.Item name="outcome" label="成果">
            <Input placeholder="例如：QPS提升至8000+" />
          </Form.Item>
          <Form.Item name="date" label="日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="skills" label="技能标签">
            <Select mode="tags" placeholder="输入技能标签" />
          </Form.Item>
          <Form.Item name="description" label="详细描述（选填）">
            <TextArea rows={2} placeholder="可选：简单描述今天做了什么..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============== 导入 ============== */}
      <Modal
        title="导入记录"
        open={importModalOpen}
        onOk={handleImport}
        onCancel={() => { setImportModalOpen(false); setImportJson(''); }}
        okText="导入"
        confirmLoading={importing}
        width={560}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            粘贴 JSON 数据（可从导出功能获取模板），或上传 JSON 文件：
          </Text>
        </div>
        <Upload
          accept=".json"
          showUploadList={false}
          beforeUpload={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => setImportJson(e.target?.result as string);
            reader.readAsText(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>选择 JSON 文件</Button>
        </Upload>
        <div style={{ marginTop: 12 }}>
          <TextArea
            rows={10}
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='[
  {
    "title": "项目标题",
    "type": "project",
    "description": "项目描述",
    "skills": ["React", "Spring Boot"],
    "achievements": ["QPS提升至5000"]
  }
]'
          />
        </div>
      </Modal>
    </div>
  );
};

export default RecordsPage;