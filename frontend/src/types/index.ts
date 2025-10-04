// TypeScript type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  author: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export type Theme = 'light' | 'dark';

export interface AppConfig {
  theme: Theme;
  apiUrl: string;
  version: string;
}