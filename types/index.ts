export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  user_type: "customer" | "contractor" | "admin";
}
