// src/types/index.ts

// Basic Tag structure from backend
export interface Tag {
    id: number;
    name: string;
    slug: string;
  }
  
  // Counter structure matching backend response (after mapping tags)
  export interface Counter {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    startDate: string; // ISO String from backend
    archivedAt: string | null; // ISO String or null from backend
    isPrivate: boolean;
    viewCount: number;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    tags: Tag[]; // Array of associated tags
    // Include creator if your backend includes it
    // creator?: { username: string };
  }
  
  // User structure matching backend response (/users/me)
  export interface User {
    id: string;
    googleId: string | null;
    email: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
  }
  
  // Structure returned by /api/counters/mine
  export interface UserCounters {
    active: Counter[];
    archived: Counter[];
  }