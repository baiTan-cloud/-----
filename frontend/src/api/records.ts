import request from './request';

export interface DailyRecord {
  id: string;
  title: string;
  type: 'project' | 'internship' | 'competition' | 'skill' | 'certification' | 'other';
  startDate?: string;
  endDate?: string;
  description: string;
  achievements?: string[];
  skills?: string[];
  attachments?: { url: string; name: string; type: string }[];
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
};
