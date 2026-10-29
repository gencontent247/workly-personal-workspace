import {format} from 'date-fns';

export type Page = 'Dashboard' | 'Công việc' | 'Thời khóa biểu' | 'Lịch' | 'Thu chi' | 'Danh mục' | 'Cài đặt';
export type Task = {id: string; title: string; category: string; priority: 'Rất cao' | 'Cao' | 'Trung bình' | 'Thấp'; date: string; status: 'Chờ' | 'Đang thực hiện' | 'Đã thực hiện' | 'Chưa xong'; time?: string; createdAt?: number};
export type Schedule = {id: string; title: string; category: string; priority: Task['priority']; startDate: string; days: number[]; startTime: string; endTime: string; statuses: Record<string, Task['status']>; createdAt?: number};
export type Transaction = {id: string; title: string; amount: number; date: string; kind: 'Thu' | 'Chi'; category: string};
export type Category = {id: string; name: string; type: 'Công việc' | 'Thu' | 'Chi'};

export const keys = {
  tasks: 'personal-workspace-tasks-v2',
  money: 'personal-workspace-money-v2',
  categories: 'personal-workspace-categories-v1',
  schedules: 'workly-schedules-v1',
  language: 'personal-workspace-language-v1'
} as const;

export const initialCategories: Category[] = [
  {id: 'task-personal', name: 'Cá nhân', type: 'Công việc'},
  {id: 'task-work', name: 'Công việc', type: 'Công việc'},
  ...['Lương', 'Thưởng', 'Kinh doanh', 'Khác'].map((name, i) => ({id: 'income-' + i, name, type: 'Thu' as const})),
  ...['Ăn uống', 'Đi lại', 'Mua sắm', 'Sinh hoạt', 'Sức khỏe', 'Khác'].map((name, i) => ({id: 'expense-' + i, name, type: 'Chi' as const}))
];

export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
export const toDate = (date: Date) => format(date, 'yyyy-MM-dd');
export function readSaved<T>(key: string): T[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
