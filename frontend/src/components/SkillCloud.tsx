import React, { useEffect, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { TooltipComponent } from 'echarts/components';
import 'echarts-wordcloud';
import { Spin } from 'antd';
import request from '../api/request';

echarts.use([TooltipComponent]);

interface SkillItem {
  name: string;
  value: number;
}

const SkillCloud: React.FC = () => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await request.get<any, { code: number; data: Record<string, number> }>(
          '/analysis/skills'
        );
        const data = res.data || {};
        const items: SkillItem[] = Object.entries(data)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 50);
        setSkills(items);
      } catch {
        // 静默处理 - 可能没有数据
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin />
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
        暂无技能数据，添加日常记录后自动生成
      </div>
    );
  }

  const option = {
    tooltip: {
      show: true,
      formatter: (params: any) => `${params.name}: ${params.value} 次`,
    },
    series: [
      {
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [12, 36],
        rotationRange: [-30, 30],
        rotationStep: 15,
        gridSize: 8,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: '-apple-system, BlinkMacSystemFont, Microsoft YaHei, sans-serif',
          fontWeight: 'normal',
          color: () => {
            const colors = [
              '#1890ff', '#52c41a', '#faad14', '#722ed1',
              '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb',
            ];
            return colors[Math.floor(Math.random() * colors.length)];
          },
        },
        emphasis: {
          textStyle: {
            fontWeight: 'bold',
            fontSize: 22,
          },
        },
        data: skills,
      },
    ],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 280 }} />;
};

export default SkillCloud;
