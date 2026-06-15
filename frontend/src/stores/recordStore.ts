import { create } from 'zustand';
import { recordsApi, DailyRecord, RecordQueryParams } from '../api/records';

interface RecordState {
  records: DailyRecord[];
  total: number;
  loading: boolean;
  params: RecordQueryParams;

  fetchRecords: (params?: RecordQueryParams) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  setParams: (params: RecordQueryParams) => void;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  total: 0,
  loading: false,
  params: { page: 0, size: 20 },

  fetchRecords: async (params) => {
    const mergedParams = { ...get().params, ...params };
    set({ loading: true, params: mergedParams });
    try {
      const res = await recordsApi.getList(mergedParams);
      set({
        records: res.data.records,
        total: res.data.total,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  deleteRecord: async (id) => {
    await recordsApi.delete(id);
    get().fetchRecords();
  },

  setParams: (params) => {
    set({ params: { ...get().params, ...params } });
  },
}));
