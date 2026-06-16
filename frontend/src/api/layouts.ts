import request from './request';

/**
 * Puck 原生数据格式（旧版，即将废弃）
 */
export interface PuckData {
  root: {
    props: Record<string, any>;
  };
  content: Array<{
    type: string;
    props: Record<string, any>;
    id: string;
  }>;
}

export interface LayoutData {
  puckData?: PuckData;
}

export interface ResumeLayout {
  id: string;
  userId: string;
  name: string;
  layoutData: LayoutData;
  templateId?: string;
  isPublicTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// =================== 新版模板模型 ===================

/** 模板节定义 */
export interface TemplateSection {
  id: string;
  type: 'personal' | 'list';
  label: string;
  dataBinding?: string;           // personal: user.name | list: project/education/...

  // 文案模板
  contentTemplate?: string;       // personal 节使用
  titleTemplate?: string;         // list 节使用：节标题
  itemTemplate?: string;          // list 节使用：每条记录渲染模板
  detailTemplate?: string;        // list 节使用：详情模板

  // 可用占位符
  availableFields?: string[];

  // 样式
  style?: Record<string, any>;

  sortOrder: number;
}

/** 模板 */
export interface Template {
  id: string;
  name: string;
  thumbnailUrl?: string;
  wordTemplateKey: string;
  sections?: TemplateSection[];   // 新版 section 模式
  layoutData?: LayoutData;        // 旧版 Puck 模式（兼容）
  tags: string[];
  usageCount: number;
  isOfficial: boolean;
}

// =================== API ===================

export const layoutsApi = {
  getList() {
    return request.get<any, { code: number; data: ResumeLayout[] }>('/layouts');
  },

  getById(id: string) {
    return request.get<any, { code: number; data: ResumeLayout }>(`/layouts/${id}`);
  },

  create(name: string, layoutData: LayoutData) {
    return request.post<any, { code: number; data: ResumeLayout }>('/layouts', { name, layoutData });
  },

  update(id: string, name: string, layoutData: LayoutData) {
    return request.put<any, { code: number; data: ResumeLayout }>(`/layouts/${id}`, { name, layoutData });
  },

  delete(id: string) {
    return request.delete<any, { code: number }>(`/layouts/${id}`);
  },
};

export const templatesApi = {
  getList() {
    return request.get<any, { code: number; data: Template[] }>('/templates');
  },

  getById(id: string) {
    return request.get<any, { code: number; data: Template }>(`/templates/${id}`);
  },

  create(data: Partial<Template>) {
    return request.post<any, { code: number; data: Template }>('/templates', data);
  },

  update(id: string, data: Partial<Template>) {
    return request.put<any, { code: number; data: Template }>(`/templates/${id}`, data);
  },

  delete(id: string) {
    return request.delete<any, { code: number }>(`/templates/${id}`);
  },

  useTemplate(id: string) {
    return request.post<any, { code: number; data: ResumeLayout }>(`/templates/${id}/use`);
  },
};

export const exportApi = {
  generateResume(layoutId: string) {
    return request.post('/export/resume', { layoutId }, { responseType: 'blob' });
  },
};
