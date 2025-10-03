
export interface DateTime {
  year: number;
  month: number; 
  day: number;
  time_stamp: number;
}

export interface Repeat {
  times?: number;
  days?: number | number[]; 
}

export interface Punishment {
  delete: boolean;
  highlight: boolean;
}

export interface Task {
  id: number;
  title: string;
  is_done: boolean;
  content: string;
  create_time: DateTime;
  update_time: DateTime;
  begin_time: DateTime | null;
  due_time: DateTime | null;
  priority: number; 
  tags: string[];
  children: string[];
  repeat?: Repeat;
  punishment: Punishment;
}

export interface Note {
  id: number;
  content: string;
  create_time: DateTime;
  update_time: DateTime;
  tags: string[];
}

export interface NavConfig {
    visible: Page[];
    hidden: Page[];
}

export interface NotificationTime {
    id: string;
    beforeDays: number; // 0 means on the due day
    time: { hour: number; minute: number }; // 24-hour format
}

export type ConfigItem = 
    | { name: string; type: 'boolean' | 'string' | 'number'; value: any; }
    | { name: 'Navigation'; type: 'nav_config'; value: NavConfig; }
    | { name: 'Notification Time'; type: 'notification_time_list'; value: NotificationTime[] };


export interface ConfigSection {
    title: string;
    items: ConfigItem[];
}

export enum Page {
    MyDay = 'My Day',
    Tasks = 'Tasks',
    Tags = 'Tags',
    Calendar = 'Calendar',
    Notes = 'Notes',
    Config = 'Config',
    TaskEdit = 'Task Edit',
    NoteEdit = 'Note Edit',
}

export type ListItem = { type: 'task'; task: Task } | { type: 'list'; title: string; foldable?: boolean, items: ListItem[] };

export interface SyncPayload {
    tasks: Task[];
    notes: Note[];
    tags: string[];  // Unified tags for both tasks and notes
    time: number;
}

export interface DayUpdate {
    [date: string]: number; // date string (YYYY-MM-DD) -> update timestamp
}