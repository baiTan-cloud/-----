import type { Config } from '@puckeditor/core';
import React from 'react';

/**
 * Puck 组件类型声明
 * 每个 key 是一种组件，value 是它的 props 类型
 */
export type ResumeProps = {
  HeadingBlock: {
    text: string;
    fontSize?: number;
    bold?: boolean;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    binding?: string;
  };
  TextBlock: {
    text: string;
    fontSize?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    binding?: string;
  };
  ExperienceList: {
    title: string;
    fontSize?: number;
    bold?: boolean;
    color?: string;
    listType: string;
    binding: string;
  };
  Divider: Record<string, never>;
  ImageBlock: {
    imageUrl?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
};

/** 数据绑定选项（所有组件共享） */
const bindingOptions = [
  { label: '不绑定（静态）', value: '' },
  { label: '用户姓名 user.name', value: 'user.name' },
  { label: '用户邮箱 user.email', value: 'user.email' },
  { label: '📁 项目经历 records[type=project]', value: 'records[type=project]' },
  { label: '💼 实习经历 records[type=internship]', value: 'records[type=internship]' },
  { label: '🎓 教育经历 records[type=education]', value: 'records[type=education]' },
  { label: '🏅 竞赛经历 records[type=competition]', value: 'records[type=competition]' },
  { label: '🛠 技能清单 records[type=skill]', value: 'records[type=skill]' },
  { label: '📜 证书 records[type=certification]', value: 'records[type=certification]' },
  { label: '其他 records[type=other]', value: 'records[type=other]' },
];

/** 列表类型选项 */
const listTypeOptions = [
  { label: '项目经历', value: 'project' },
  { label: '实习经历', value: 'internship' },
  { label: '教育经历', value: 'education' },
  { label: '竞赛经历', value: 'competition' },
  { label: '技能清单', value: 'skill' },
  { label: '证书', value: 'certification' },
  { label: '其他', value: 'other' },
];

export const config: Config<ResumeProps> = {
  components: {
    // ========== 标题组件 ==========
    HeadingBlock: {
      label: '标题',
      fields: {
        text: { type: 'text', label: '文本内容' },
        fontSize: { type: 'number', label: '字号', min: 8, max: 72 },
        bold: {
          type: 'radio',
          label: '加粗',
          options: [
            { label: '是', value: true },
            { label: '否', value: false },
          ],
        },
        color: { type: 'text', label: '颜色' },
        textAlign: {
          type: 'radio',
          label: '对齐',
          options: [
            { label: '左', value: 'left' },
            { label: '中', value: 'center' },
            { label: '右', value: 'right' },
          ],
        },
        binding: { type: 'select', label: '数据绑定', options: bindingOptions },
      },
      defaultProps: {
        text: '姓名',
        fontSize: 26,
        bold: true,
        color: '#262626',
        textAlign: 'center',
        binding: 'user.name',
      },
      render: ({ text, fontSize, bold, color, textAlign, binding }) => (
        <div style={{ textAlign: textAlign || 'center', padding: '12px 16px' }}>
          <span
            style={{
              fontSize: fontSize || 26,
              fontWeight: bold ? 700 : 400,
              color: color || '#262626',
            }}
          >
            {text}
          </span>
          {binding && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                color: '#1890ff',
                background: '#e6f7ff',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {binding}
            </span>
          )}
        </div>
      ),
    },

    // ========== 文本框组件 ==========
    TextBlock: {
      label: '文本框',
      fields: {
        text: { type: 'textarea', label: '文本内容' },
        fontSize: { type: 'number', label: '字号', min: 8, max: 72 },
        color: { type: 'text', label: '颜色' },
        textAlign: {
          type: 'radio',
          label: '对齐',
          options: [
            { label: '左', value: 'left' },
            { label: '中', value: 'center' },
            { label: '右', value: 'right' },
          ],
        },
        binding: { type: 'select', label: '数据绑定', options: bindingOptions },
      },
      defaultProps: {
        text: '请输入文本内容',
        fontSize: 12,
        color: '#595959',
        textAlign: 'left',
        binding: '',
      },
      render: ({ text, fontSize, color, textAlign, binding }) => (
        <div style={{ textAlign: textAlign || 'left', padding: '8px 16px' }}>
          <p
            style={{
              fontSize: fontSize || 12,
              color: color || '#595959',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </p>
          {binding && (
            <span
              style={{
                fontSize: 10,
                color: '#1890ff',
                background: '#e6f7ff',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {binding}
            </span>
          )}
        </div>
      ),
    },

    // ========== 经历列表 ==========
    ExperienceList: {
      label: '经历列表',
      fields: {
        title: { type: 'text', label: '标题' },
        fontSize: { type: 'number', label: '标题字号', min: 8, max: 72 },
        bold: {
          type: 'radio',
          label: '加粗',
          options: [
            { label: '是', value: true },
            { label: '否', value: false },
          ],
        },
        color: { type: 'text', label: '标题颜色' },
        listType: {
          type: 'select',
          label: '记录类型',
          options: listTypeOptions,
        },
        binding: {
          type: 'select',
          label: '数据绑定',
          options: bindingOptions.filter((o) => o.value.startsWith('records') || o.value === ''),
        },
      },
      defaultProps: {
        title: '经历标题',
        fontSize: 16,
        bold: true,
        color: '#1890ff',
        listType: 'project',
        binding: 'records[type=project]',
      },
      render: ({ title, fontSize, bold, color, listType, binding }) => (
        <div style={{ padding: '8px 16px' }}>
          <div
            style={{
              fontSize: fontSize || 16,
              fontWeight: bold ? 700 : 400,
              color: color || '#1890ff',
              borderBottom: `2px solid ${color || '#1890ff'}`,
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            {title}
          </div>
          <div style={{ opacity: 0.5, fontSize: 12, color: '#8c8c8c', padding: '8px 0' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>示例项目标题（2024.01 - 2024.06）</div>
            <div>项目描述将在导出时从日常记录自动填充...</div>
          </div>
          <span
            style={{
              fontSize: 10,
              color: '#1890ff',
              background: '#e6f7ff',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {binding || '未绑定数据'}
          </span>
        </div>
      ),
    },

    // ========== 分割线 ==========
    Divider: {
      label: '分割线',
      fields: {},
      defaultProps: {},
      render: () => (
        <div style={{ padding: '8px 16px' }}>
          <div
            style={{
              width: '100%',
              height: 1,
              background: '#d9d9d9',
            }}
          />
        </div>
      ),
    },

    // ========== 图片 ==========
    ImageBlock: {
      label: '图片',
      fields: {
        imageUrl: { type: 'text', label: '图片地址' },
        textAlign: {
          type: 'radio',
          label: '对齐',
          options: [
            { label: '左', value: 'left' },
            { label: '中', value: 'center' },
            { label: '右', value: 'right' },
          ],
        },
      },
      defaultProps: {
        imageUrl: '',
        textAlign: 'center',
      },
      render: ({ imageUrl, textAlign }) => (
        <div style={{ textAlign: textAlign || 'center', padding: '12px 16px' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                height: 80,
                background: '#fafafa',
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8c8c8c',
                fontSize: 12,
              }}
            >
              🖼️ 点击属性面板输入图片地址
            </div>
          )}
        </div>
      ),
    },
  },
};

export default config;
