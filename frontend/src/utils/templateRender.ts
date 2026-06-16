/**
 * 模板渲染工具（客户端预览用）
 * 和后端 TemplateRenderEngine 逻辑同步
 */

import type { TemplateSection, DailyRecord } from '../api/records';

export interface SectionPreviewResult {
  sectionId: string;
  label: string;
  type: 'personal' | 'list';
  rendered: string;      // HTML 片段
  sortOrder: number;
}

/** 个人信息值 */
export interface PersonalData {
  name?: string;
  email?: string;
  phone?: string;
}

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

/** 替换占位符 */
function replacePlaceholders(tpl: string, values: Record<string, string>): string {
  if (!tpl) return '';
  return tpl.replace(PLACEHOLDER_RE, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  }).trim();
}

/** 从 style 中提取 CSS 字符串 */
function styleToCss(style?: Record<string, any>, prefix?: string): string {
  if (!style) return '';
  const css: string[] = [];
  const keys = prefix
    ? Object.keys(style).filter(k => k.startsWith(prefix))
    : Object.keys(style);

  for (const key of keys) {
    const cssKey = key
      .replace(prefix || '', '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    const val = style[key];
    if (val !== undefined && val !== null) {
      if (typeof val === 'number') {
        css.push(`${cssKey}:${val}px`);
      } else {
        css.push(`${cssKey}:${val}`);
      }
    }
  }
  return css.join(';');
}

/** 构建记录字段映射 */
function buildRecordMap(record: DailyRecord): Record<string, string> {
  const fmtDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' }); }
    catch { return d.slice(0, 7); }
  };

  return {
    title: record.title || '',
    role: record.role || '',
    orgName: record.orgName || '',
    whatDone: record.whatDone || '',
    challenge: record.challenge || '',
    solution: record.solution || '',
    outcome: record.outcome || '',
    startDate: record.startDate ? fmtDate(record.startDate) : '',
    endDate: record.endDate ? fmtDate(record.endDate) : '至今',
    skills: record.skills?.join('、') || '',
    achievements: record.achievements?.join('；') || '',
    major: record.major || '',
    degree: record.degree || '',
    gpa: record.gpa || '',
    description: record.description || '',
  };
}

/** 构建用户字段映射 */
function buildUserMap(user?: PersonalData): Record<string, string> {
  return {
    name: user?.name || '姓名',
    email: user?.email || 'email@example.com',
    phone: user?.phone || '',
  };
}

/**
 * 渲染单个模板节（客户端预览）
 */
export function renderSection(
  section: TemplateSection,
  user: PersonalData | undefined,
  records: DailyRecord[]
): SectionPreviewResult {
  const styleStr = styleToCss(section.style);

  if (section.type === 'personal') {
    const values = buildUserMap(user);
    const text = replacePlaceholders(section.contentTemplate, values);
    return {
      sectionId: section.id,
      label: section.label,
      type: 'personal',
      rendered: styleStr
        ? `<div style="${styleStr}">${escHtml(text)}</div>`
        : `<div>${escHtml(text)}</div>`,
      sortOrder: section.sortOrder,
    };
  }

  if (section.type === 'list') {
    const binding = section.dataBinding || '';
    const filtered = records.filter(r => r.type === binding);

    if (filtered.length === 0) {
      return {
        sectionId: section.id,
        label: section.label,
        type: 'list',
        rendered: '',
        sortOrder: section.sortOrder,
      };
    }

    const sorted = [...filtered].sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    const parts: string[] = [];

    // 标题
    if (section.titleTemplate) {
      const titleStyle = styleToCss(section.style, 'title');
      parts.push(`<div style="font-weight:700;${titleStyle}">${escHtml(section.titleTemplate)}</div>`);
    }

    // 每条记录
    for (let i = 0; i < sorted.length; i++) {
      const record = sorted[i];
      const values = buildRecordMap(record);

      if (section.itemTemplate) {
        const text = replacePlaceholders(section.itemTemplate, values);
        const itemStyle = styleToCss(section.style, 'item');
        parts.push(`<div style="${itemStyle}">${escHtml(text)}</div>`);
      }

      if (section.detailTemplate) {
        const text = replacePlaceholders(section.detailTemplate, values);
        if (text) {
          parts.push(`<div style="font-size:0.9em;color:#888;margin-top:2px">${escHtml(text)}</div>`);
        }
      }

      if (i < sorted.length - 1) {
        parts.push(`<div style="height:10px"></div>`);
      }
    }

    return {
      sectionId: section.id,
      label: section.label,
      type: 'list',
      rendered: styleStr
        ? `<div style="${styleStr}">${parts.join('\n')}</div>`
        : parts.join('\n'),
      sortOrder: section.sortOrder,
    };
  }

  return {
    sectionId: section.id,
    label: section.label,
    type: 'personal',
    rendered: '',
    sortOrder: section.sortOrder,
  };
}

/**
 * 渲染完整模板（客户端预览）
 */
export function renderTemplate(
  sections: TemplateSection[],
  user: PersonalData | undefined,
  records: DailyRecord[]
): { html: string; sectionResults: SectionPreviewResult[] } {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  const results = sorted.map(s => renderSection(s, user, records));

  const html = results
    .filter(r => r.rendered)
    .map(r => r.rendered)
    .join('\n');

  return { html, sectionResults: results };
}

function escHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
