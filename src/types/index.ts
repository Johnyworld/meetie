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

// Auth
export interface Profile {
  id: string;
  email: string;
  nickname: string;
  provider: 'email' | 'google';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  provider: 'email' | 'google';
}

// API error
export interface ApiError {
  message: string;
  statusCode: number;
}
