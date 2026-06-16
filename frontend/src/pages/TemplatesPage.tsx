import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Spin,
  message,
  Empty,
  Space,
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { templatesApi, Template } from '../api/layouts';

const { Title, Text } = Typography;

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingId, setUsingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await templatesApi.getList();
        setTemplates(res.data || []);
      } catch {
        message.error('加载模板列表失败');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleUseTemplate = async (template: Template) => {
    setUsingId(template.id);
    try {
      const res = await templatesApi.useTemplate(template.id);
      message.success('模板已应用，正在打开编辑器...');
      navigate(`/editor?id=${res.data.id}`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || '应用模板失败');
    } finally {
      setUsingId(null);
    }
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
            模板市场
          </Title>
          <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: 4 }}>
            {templates.length} 个可用模板 · 选择后即可在编辑器中自定义
          </div>
        </div>
        <Button icon={<ToolOutlined />} onClick={() => navigate('/template-editor')}>
           设计模板
        </Button>
        <Button icon={<PlusOutlined />} onClick={() => navigate('/editor')}>
           从零创建布局 (旧)
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <Empty description="暂无可用模板" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {templates.map((tpl) => (
            <Col key={tpl.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                actions={tpl.sections?.length ? [
                  <EditOutlined key="edit" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/template-editor?id=${tpl.id}`);
                  }} />,
                ] : undefined}
                cover={
                  <div
                    style={{
                      height: 200,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 40,
                      fontWeight: 700,
                      position: 'relative',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>简历模板</div>
                      <div style={{ fontSize: 20 }}>{tpl.name}</div>
                    </div>
                  </div>
                }
              >
                <Card.Meta
                  title={tpl.name}
                  description={
                    <div>
                      <Space wrap style={{ marginBottom: 8 }}>
                        {(tpl.tags || []).map((tag) => (
                          <Tag key={tag} color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        👥 {tpl.usageCount || 0} 次使用
                        {tpl.isOfficial && (
                          <Tag color="gold" style={{ marginLeft: 8, fontSize: 10 }}>
                            官方
                          </Tag>
                        )}
                      </div>
                    </div>
                  }
                />
                <Space style={{ marginTop: 12, width: '100%' }} direction="vertical">
                  <Button
                    type="primary"
                    block
                    icon={<EyeOutlined />}
                    onClick={() => handleUseTemplate(tpl)}
                    loading={usingId === tpl.id}
                  >
                    {tpl.sections?.length ? '使用此模板' : '使用此布局 (旧)'}
                  </Button>
                  {tpl.sections?.length ? (
                    <Button
                      block
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/template-editor?id=${tpl.id}`);
                      }}
                    >
                      编辑模板
                    </Button>
                  ) : null}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default TemplatesPage;
