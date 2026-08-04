export interface DashboardStats {
  notes: {
    total: number;
    completed: number;
    pinned: number;
  };
  prompts: {
    total: number;
  };
  assets: {
    total: number;
    totalStorageBytes: number;
  };
}
