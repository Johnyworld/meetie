// Base document interface (Supabase auto-generated fields)
export interface BaseDocument {
  id: string;
  created_at: string;
  updated_at: string;
}

// User
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

// API error
export interface ApiError {
  message: string;
  statusCode: number;
}
