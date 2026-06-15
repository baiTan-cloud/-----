import React, { useEffect, useState, useCallback } from 'react';
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
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { recordsApi, DailyRecord } from '../api/records';

const { Title } = Typography;
const { TextArea } = Input;

const typeConfig: Record<string, { color: string; label: string; icon: string }> = {
  project: { color: 'blue', label: '项目', icon: '📁' },
  internship: { color: 'orange', label: '实习', icon: '💼' },
  competition: { color: 'green', label: '竞赛', icon: '🏅' },
  skill: { color: 'purple', label: '技能', icon: '📜' },
  certification: { color: 'cyan', label: '证书', icon: '🎓' },
  other: { color: 'default', label: '其他', icon: '📌' },
};

const RecordsPage: React.FC = () => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();

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
    } catch {
      message.error('加载记录失败');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, keyword]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: DailyRecord) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      type: record.type,
      description: record.description,
      skills: record.skills,
      link: record.link,
    });
    setModalOpen(true);
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

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingId) {
        await recordsApi.update(editingId, values);
        message.success('已更新');
      } else {
        await recordsApi.create(values);
        message.success('已创建');
      }
      setModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            日常记录
          </Title>
          <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: 4 }}>
            管理你的履历素材，共 {total} 条记录
          </div>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加记录
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索标题或描述..."
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); fetchRecords(); }}
          />
          <Select
            placeholder="全部类型"
            style={{ width: 140 }}
            allowClear
            value={typeFilter}
            onChange={(val) => { setTypeFilter(val); setPage(1); }}
            options={[
              { label: '全部类型', value: undefined },
              { label: '项目', value: 'project' },
              { label: '实习', value: 'internship' },
              { label: '竞赛', value: 'competition' },
              { label: '技能', value: 'skill' },
              { label: '证书', value: 'certification' },
            ]}
          />
        </Space>
      </Card>

      <Spin spinning={loading}>
        {records.length === 0 && !loading ? (
          <Card>
            <Empty
              description="暂无日常记录，点击上方「添加记录」开始积累履历素材"
              style={{ padding: '60px 0' }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加第一条记录
              </Button>
            </Empty>
          </Card>
        ) : (
          <List
            dataSource={records}
            renderItem={(record) => (
              <Card style={{ marginBottom: 12 }} hoverable>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                      background: record.type === 'project' ? '#e6f7ff' :
                                  record.type === 'internship' ? '#fff7e6' :
                                  record.type === 'competition' ? '#f6ffed' :
                                  record.type === 'certification' ? '#f9f0ff' : '#f5f5f5',
                    }}
                  >
                    {typeConfig[record.type]?.icon || '📌'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {record.title}
                      <Tag color={typeConfig[record.type]?.color}>
                        {typeConfig[record.type]?.label || record.type}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {record.description}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {record.skills?.map((s) => (
                        <Tag key={s} color="blue" style={{ fontSize: 11 }}>{s}</Tag>
                      ))}
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {record.startDate ? new Date(record.startDate).toLocaleDateString('zh-CN') : ''}
                        {record.startDate && record.endDate ? ' - ' : ''}
                        {record.endDate ? new Date(record.endDate).toLocaleDateString('zh-CN') : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', flexShrink: 0 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(record.id)}
                    />
                  </div>
                </div>
              </Card>
            )}
          />
        )}

        {total > 10 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={10}
              onChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Spin>

      <Modal
        title={editingId ? '编辑记录' : '添加日常记录'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={640}
        okText={editingId ? '保存修改' : '保存记录'}
        cancelText="取消"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="记录标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="例如：电商秒杀系统设计" />
          </Form.Item>

          <Form.Item name="type" label="记录类型" rules={[{ required: true }]} initialValue="project">
            <Select
              options={[
                { label: '📁 项目', value: 'project' },
                { label: '💼 实习', value: 'internship' },
                { label: '🏅 竞赛', value: 'competition' },
                { label: '📜 技能', value: 'skill' },
                { label: '🎓 证书', value: 'certification' },
                { label: '📌 其他', value: 'other' },
              ]}
            />
          </Form.Item>

          <Form.Item name="startDate" label="开始时间">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="endDate" label="结束时间">
            <Input type="date" />
          </Form.Item>

          <Form.Item name="description" label="详细描述" rules={[{ required: true, message: '请填写描述' }]}>
            <TextArea rows={5} placeholder="请详细描述你的经历，建议使用 STAR 法则并量化成果..." />
          </Form.Item>

          <Form.Item name="achievements" label="成果列表">
            <Select mode="tags" placeholder="输入成果后回车（例如：QPS提升至8000+）" />
          </Form.Item>

          <Form.Item name="skills" label="技能标签">
            <Select mode="tags" placeholder="输入技能标签" />
          </Form.Item>

          <Form.Item name="link" label="关联链接">
            <Input placeholder="GitHub 仓库 / 证书验证链接" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RecordsPage;
