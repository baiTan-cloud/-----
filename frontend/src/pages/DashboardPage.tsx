import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Skeleton } from 'antd';
import {
  FileTextOutlined,
  TagOutlined,
  LayoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SkillCloud from '../components/SkillCloud';
import request from '../api/request';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ records: 0, skills: 0, layouts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [recordRes, skillsRes] = await Promise.all([
          request.get('/records?size=1'),
          request.get('/analysis/skills'),
        ]);
        setStats({
          records: (recordRes as any)?.data?.total || 0,
          skills: Object.keys((skillsRes as any)?.data || {}).length,
          layouts: 0,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, color, onClick }: any) => (
    <Card hoverable={!!onClick} onClick={onClick}>
      <Statistic
        title={title}
        value={loading ? '-' : value}
        prefix={<span style={{ color }}>{icon}</span>}
      />
    </Card>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            仪表盘
          </Title>
          <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: 4 }}>
            欢迎回来，以下是你的履历概览
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="日常记录"
            value={stats.records}
            icon={<FileTextOutlined />}
            color="#1890ff"
            onClick={() => navigate('/records')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="技能标签"
            value={stats.skills}
            icon={<TagOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="简历布局"
            value={stats.layouts}
            icon={<LayoutOutlined />}
            color="#faad14"
            onClick={() => navigate('/my-layouts')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="本月新增"
            value={3}
            icon={<PlusOutlined />}
            color="#722ed1"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="技能词云" style={{ minHeight: 300 }}>
            {loading ? <Skeleton active /> : <SkillCloud />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近动态">
            <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '40px 0' }}>
              暂无最近动态
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
