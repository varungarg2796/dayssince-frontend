// frontend/src/types/index.ts

// Basic Tag structure from backend
export interface Tag {
    id: number;
    name: string;
    slug: string;
  }

  // Counter structure matching backend response
  export interface Counter {
    id: string;
    userId: string; // The ID of the user who owns the counter
    name: string;
    description: string | null;
    startDate: string; // ISO String from backend
    archivedAt: string | null; // ISO String or null from backend
    isPrivate: boolean;
    viewCount: number;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    tags: Tag[]; // Array of associated tags
    // --- CORRECTED FIELD NAME ---
    // The backend sends 'user', not 'creator'
    user?: { // Changed from 'creator' to 'user'
      username: string;
    };
    // ---------------------------
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

  // DTO for creating counters
  export interface CreateCounterDto {
    name: string;
    description?: string;
    startDate: string; // Expecting ISO string for API
    isPrivate?: boolean;
    tagIds?: number[];
  }

  // Payload for updating counters
  export interface UpdateCounterPayload {
    name?: string;
    description?: string;
    startDate?: string; // ISO String
    isPrivate?: boolean;
    tagIds?: number[];
  }

  // --- Types for Public Counters Fetching ---
  export interface FindPublicCountersOptions {
    page?: number;
    limit?: number;
    sortBy?: 'startDate' | 'createdAt' | 'name' | 'popularity';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    tagSlugs?: string[]; // Array of tag slugs
  }

  export interface PaginatedCountersResult {
    items: Counter[]; // items array now contains Counters which include the user field
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }
  // -----------------------------------------