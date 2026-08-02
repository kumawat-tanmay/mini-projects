export interface StickyNote {
  _id: string;
  userId: string;
  title: string;
  content: string;
  bgColor: string;
  textColor: string;
  isPinned: boolean;
  isCompleted: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteStats {
  total: number;
  pinned: number;
  completed: number;
  max: number;
}

export type SortOption = 'newest' | 'oldest' | 'color' | 'completed-last';
export type FilterOption = 'all' | 'pinned' | 'active' | 'completed';

export const NOTE_COLORS: string[] = [
  '#FDE047', // Yellow
  '#7DD3FC', // Sky
  '#6EE7B7', // Emerald
  '#FDA4AF', // Rose/Red
  '#FDBA74', // Orange
  '#D8B4FE', // Purple
];

export const NOTE_COLOR_NAMES: Record<string, string> = {
  '#FDE047': 'Yellow',
  '#7DD3FC': 'Sky',
  '#6EE7B7': 'Emerald',
  '#FDA4AF': 'Red',
  '#FDBA74': 'Orange',
  '#D8B4FE': 'Purple',
};
