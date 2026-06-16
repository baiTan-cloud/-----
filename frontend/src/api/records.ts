import request from './request';

export interface RecordEntry {
  date?: string;
  description: string;
  achievements?: string[];
  skills?: string[];
}

export interface DailyRecord {
  id: string;
  title: string;
  type: 'project' | 'internship' | 'competition' | 'skill' | 'certification' | 'education' | 'other';
  startDate?: string;
  endDate?: string;

  // 碎片化字段（新）
  role?: string;
  orgName?: string;
  whatDone?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;

  // 旧字段（兼容）
  description?: string;
  achievements?: string[];
  skills?: string[];

  // 教育专有
  major?: string;
  degree?: string;
  gpa?: string;

  attachments?: { url: string; name: string; type: string }[];
  entries?: RecordEntry[];
  link?: string;
  isPublic?: boolean;
  isHidden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecordQueryParams {
  page?: number;
  size?: number;
  type?: string;
  keyword?: string;
  skills?: string;
  sort?: string;
}

export const recordsApi = {
  getList(params?: RecordQueryParams) {
    return request.get<any, { code: number; message: string; data: { records: DailyRecord[]; total: number } }>(
      '/records',
      { params }
    );
  },

  getById(id: string) {
    return request.get<any, { code: number; message: string; data: DailyRecord }>(`/records/${id}`);
  },

  create(data: Partial<DailyRecord>) {
    return request.post<any, { code: number; message: string; data: DailyRecord }>('/records', data);
  },

  update(id: string, data: Partial<DailyRecord>) {
    return request.put<any, { code: number; message: string; data: DailyRecord }>(`/records/${id}`, data);
  },

  delete(id: string) {
    return request.delete<any, { code: number; message: string }>(`/records/${id}`);
  },

  batchDelete(ids: string[]) {
    return request.delete<any, { code: number; message: string }>('/records/batch', { data: ids });
  },

  exportRecords(params?: { type?: string; format?: string }) {
    return request.get('/records/export', {
      params,
      responseType: 'blob',
    });
  },

  importRecords(data: Partial<DailyRecord>[]) {
    return request.post<any, { code: number; message: string; data: number }>('/records/import', data);
  },
};

export const analysisApi = {
  getSkills() {
    return request.get<any, { code: number; data: Record<string, number> }>('/analysis/skills');
  },

  getStats() {
    return request.get<any, { code: number; data: { totalRecords: number; typeDistribution: Record<string, number>; monthlyTrend: Record<string, number>; skillFrequency: Record<string, number> } }>('/analysis/stats');
  },
};
