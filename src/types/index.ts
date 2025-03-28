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