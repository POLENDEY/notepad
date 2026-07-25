export type Note = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  color: string;
  is_pinned: boolean;
  deleted_at: string | null;
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
