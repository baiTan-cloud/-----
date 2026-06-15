import request from './request';

/**
 * Puck 原生数据格式
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

/**
 * 布局数据（后端存储格式）
 */
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

export interface Template {
  id: string;
  name: string;
  thumbnailUrl?: string;
  wordTemplateKey: string;
  layoutData: LayoutData;
  tags: string[];
  usageCount: number;
  isOfficial: boolean;
}

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

  useTemplate(id: string) {
    return request.post<any, { code: number; data: ResumeLayout }>(`/templates/${id}/use`);
  },
};

export const exportApi = {
  generateResume(layoutId: string) {
    return request.post('/export/resume', { layoutId }, { responseType: 'blob' });
  },
};
