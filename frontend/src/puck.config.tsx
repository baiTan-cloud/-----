import type { Config, Field } from '@puckeditor/core';
import React from 'react';

/**
 * Puck 组件类型声明
 */
export type ResumeProps = {
  HeadingBlock: {
    text: string;
    fontSize?: number;
    bold?: 'yes' | 'no';
    color?: string;
    bgColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    paddingY?: number;
    binding?: string;
  };
  TextBlock: {
    text: string;
    fontSize?: number;
    color?: string;
    lineHeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    binding?: string;
  };
  ExperienceList: {
    title: string;
    fontSize?: number;
    bold?: 'yes' | 'no';
    color?: string;
    listType: string;
    showDivider?: 'yes' | 'no';
    binding: string;
  };
  ImageBlock: {
    imageUrl?: string;
    width?: number;
    borderRadius?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
};

/** 颜色选择器自定义字段 */
function ColorField({ name, value, onChange }: { name: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 36, height: 36, padding: 0, border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer' }}
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        style={{ flex: 1, height: 32, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 8px', fontSize: 13 }}
      />
    </div>
  );
}

/** 数据绑定选项 */
const bindingOptions = [
  { label: '不绑定（静态）', value: 'none' },
  { label: '用户姓名', value: 'user.name' },
  { label: '用户邮箱', value: 'user.email' },
  { label: '📁 项目经历', value: 'records[type=project]' },
  { label: '💼 实习经历', value: 'records[type=internship]' },
  { label: '🎓 教育经历', value: 'records[type=education]' },
  { label: '🏅 竞赛经历', value: 'records[type=competition]' },
  { label: '🛠 技能清单', value: 'records[type=skill]' },
  { label: '📜 证书', value: 'records[type=certification]' },
  { label: '其他', value: 'records[type=other]' },
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
            { label: '是', value: 'yes' },
            { label: '否', value: 'no' },
          ],
        },
        color: {
          type: 'custom',
          label: '文字颜色',
          render: ColorField,
        },
        bgColor: {
          type: 'custom',
          label: '背景颜色',
          render: ColorField,
        },
        textAlign: {
          type: 'radio',
          label: '对齐',
          options: [
            { label: '左', value: 'left' },
            { label: '中', value: 'center' },
            { label: '右', value: 'right' },
          ],
        },
        letterSpacing: { type: 'number', label: '字间距', min: 0, max: 20 },
        paddingY: { type: 'number', label: '上下边距', min: 0, max: 60 },
        binding: { type: 'select', label: '数据绑定', options: bindingOptions },
      },
      defaultProps: {
        text: '姓名',
        fontSize: 26,
        bold: 'yes',
        color: '#262626',
        bgColor: 'transparent',
        textAlign: 'center',
        letterSpacing: 0,
        paddingY: 12,
        binding: 'user.name',
      },
      render: ({ text, fontSize, bold, color, bgColor, textAlign, letterSpacing, paddingY, binding }) => (
        <div
          style={{
            textAlign: textAlign || 'center',
            padding: `${paddingY || 12}px 16px`,
            background: bgColor && bgColor !== 'transparent' ? bgColor : 'transparent',
          }}
        >
          <span
            style={{
              fontSize: fontSize || 26,
              fontWeight: bold === 'yes' ? 700 : 400,
              color: color || '#262626',
              letterSpacing: letterSpacing || 0,
            }}
          >
            {text}
          </span>
          {binding && binding !== 'none' && (
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
        color: {
          type: 'custom',
          label: '文字颜色',
          render: ColorField,
        },
        lineHeight: { type: 'number', label: '行高', min: 1, max: 3, step: 0.1 },
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
        lineHeight: 1.6,
        textAlign: 'left',
        binding: 'none',
      },
      render: ({ text, fontSize, color, lineHeight, textAlign, binding }) => (
        <div style={{ textAlign: textAlign || 'left', padding: '8px 16px' }}>
          <p
            style={{
              fontSize: fontSize || 12,
              color: color || '#595959',
              lineHeight: lineHeight || 1.6,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </p>
          {binding && binding !== 'none' && (
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
            { label: '是', value: 'yes' },
            { label: '否', value: 'no' },
          ],
        },
        color: {
          type: 'custom',
          label: '标题颜色',
          render: ColorField,
        },
        listType: {
          type: 'select',
          label: '记录类型',
          options: listTypeOptions,
        },
        showDivider: {
          type: 'radio',
          label: '显示分割线',
          options: [
            { label: '显示', value: 'yes' },
            { label: '隐藏', value: 'no' },
          ],
        },
        binding: {
          type: 'select',
          label: '数据绑定',
          options: bindingOptions.filter((o) => o.value.startsWith('records') || o.value === 'none'),
        },
      },
      defaultProps: {
        title: '经历标题',
        fontSize: 16,
        bold: 'yes',
        color: '#1890ff',
        listType: 'project',
        showDivider: 'yes',
        binding: 'records[type=project]',
      },
      render: ({ title, fontSize, bold, color, listType, showDivider, binding }) => (
        <div style={{ padding: '8px 16px' }}>
          <div
            style={{
              fontSize: fontSize || 16,
              fontWeight: bold === 'yes' ? 700 : 400,
              color: color || '#1890ff',
              borderBottom: showDivider === 'yes' ? `2px solid ${color || '#1890ff'}` : 'none',
              paddingBottom: showDivider === 'yes' ? 4 : 0,
              marginBottom: 8,
            }}
          >
            {title}
          </div>
          <div style={{ opacity: 0.5, fontSize: 12, color: '#8c8c8c', padding: '8px 0' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>示例项目标题（2024.01 - 2024.06）</div>
            <div>项目描述将在导出时从日常记录自动填充...</div>
          </div>
          {binding && binding !== 'none' && (
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

    // ========== 图片 ==========
    ImageBlock: {
      label: '图片',
      fields: {
        imageUrl: { type: 'text', label: '图片地址', placeholder: 'https://...' },
        width: { type: 'number', label: '宽度', min: 20, max: 800 },
        borderRadius: { type: 'number', label: '圆角', min: 0, max: 50 },
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
        width: 200,
        borderRadius: 0,
        textAlign: 'center',
      },
      render: ({ imageUrl, width, borderRadius, textAlign }) => (
        <div style={{ textAlign: textAlign || 'center', padding: '12px 16px' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{
                maxWidth: width || 200,
                maxHeight: 200,
                borderRadius: borderRadius || 0,
                objectFit: 'contain',
              }}
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
              🖼️ 在属性面板输入图片地址
            </div>
          )}
        </div>
      ),
    },
  },
};

export default config;
