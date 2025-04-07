// frontend/src/types/index.ts

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Counter {
  id: string;
  userId: string;
  name: string;
  slug: string; // Added
  description: string | null;
  startDate: string;
  archivedAt: string | null;
  isPrivate: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  user?: {
    username: string;
  };
}

export interface User {
  id: string;
  googleId: string | null;
  email: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCounters {
  active: Counter[];
  archived: Counter[];
}

// Include optional slug
export interface CreateCounterDto {
  name: string;
  description?: string;
  startDate: string;
  isPrivate?: boolean;
  tagIds?: number[];
  slug?: string; // Added
}

// Include optional slug
export interface UpdateCounterPayload {
  name?: string;
  description?: string;
  startDate?: string;
  isPrivate?: boolean;
  tagIds?: number[];
  slug?: string; // Added
}

export interface FindPublicCountersOptions {
  page?: number;
  limit?: number;
  sortBy?: 'startDate' | 'createdAt' | 'name' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  tagSlugs?: string[];
}

export interface PaginatedCountersResult {
  items: Counter[]; // Counter now includes slug
  totalItems: number;
  totalPages: number;
  currentPage: number;
}