// Base document interface (bkend.ai auto-generated fields)
export interface BaseDocument {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// User
export interface User extends BaseDocument {
  email: string;
  name?: string;
  avatarUrl?: string;
}

// Auth responses
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// API error
export interface ApiError {
  message: string;
  statusCode: number;
}
