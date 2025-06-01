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
  slug: string;
  description: string | null;
  startDate: string; // ISO Date String
  archivedAt: string | null; // ISO Date String
  isPrivate: boolean;
  viewCount: number;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  tags: Tag[];
  user?: { // Optional user object, typically included for public counters
    username: string;
  };

  // --- NEW CHALLENGE FIELDS ---
  isChallenge?: boolean;          // Is this counter a challenge?
  challengeDurationDays?: number; // Target duration in days
  challengeAchievedAt?: string | null; // ISO Date String, when the challenge was met
                                     // This will be null if not achieved or not a challenge.
                                     // Backend might not set this in V1; frontend will calculate completion.
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

export interface CreateCounterDto {
  name: string;
  description?: string;
  startDate: string; // ISO Date String from client
  isPrivate?: boolean;
  tagIds?: number[];
  slug?: string;

  // --- NEW CHALLENGE FIELDS ---
  isChallenge?: boolean;
  challengeDurationDays?: number; // Duration in days
}

// UpdateCounterPayload will automatically include these new fields as optional
// because it typically extends Partial<CreateCounterDto> or similar.
// If defined explicitly, add them there too.
export interface UpdateCounterPayload {
  name?: string;
  description?: string;
  startDate?: string; // ISO Date String from client
  isPrivate?: boolean;
  tagIds?: number[];
  slug?: string;

  // --- NEW CHALLENGE FIELDS ---
  isChallenge?: boolean;
  challengeDurationDays?: number;
  // Note: We are not allowing the client to directly set challengeAchievedAt.
  // That will be determined by logic (backend in future, or frontend for now).
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
  items: Counter[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}