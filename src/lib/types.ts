export type NoteCategory = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  body: string;
  color: string;
  is_pinned: boolean;
  tags: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  pin_set_at: string | null;
  created_at: string;
  updated_at: string;
};
