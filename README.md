# DaysSince Frontend (Next.js + Mantine)

This is the frontend application for the DaysSince project, built with Next.js (App Router) and Mantine UI. It allows users to view, create, and manage time counters tracking events.

## Features (MVP Scope & Planned)

*   View personal active and archived counters.
*   Create, edit, archive, unarchive, and delete counters.
*   Explore public counters created by other users.
*   Search, filter, and sort public counters.
*   Responsive design for desktop and mobile.
*   Authentication via Google OAuth (using backend API).
*   Header-based JWT authentication for API communication.
*   Real-time display for active counters (WIP).

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [Mantine UI](https://mantine.dev/)
*   **State Management:**
    *   [Zustand](https://github.com/pmndrs/zustand) (Client State - Auth)
    *   [TanStack Query (React Query)](https://tanstack.com/query/latest) (Server State - API Data)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) (Planned)
*   **Styling:** Mantine (Emotion/Styled System) + PostCSS
*   **API Client:** [Axios](https://axios-http.com/)
*   **Icons:** [Tabler Icons](https://tabler-icons.io/) (`@tabler/icons-react`)
*   **Linting:** ESLint
*   **Package Manager:** npm / yarn (choose one)

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended, e.g., v18+)
*   npm or yarn
*   A running instance of the [DaysSince Backend API](<link-to-your-backend-repo>) (usually on `http://localhost:3000`)

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-frontend-repo-url>
    cd dayssince-frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

### Environment Variables

This frontend doesn't typically require many environment variables for local development, but ensure the backend API URL configured in `src/lib/apiClient.ts` (and potentially `src/components/Layout/MainLayout.tsx` for the direct Google login link) matches your running backend (default `http://localhost:3000/api`).

For production builds, Next.js environment variables might be used for things like the public API URL if it differs.

### Running the Development Server

1.  Ensure the backend server is running.
2.  Start the frontend development server (defaults to port 3001 to avoid conflict with backend):
    ```bash
    npm run dev -- -p 3001
    # or
    yarn dev -p 3001
    ```
3.  Open [http://localhost:3001](http://localhost:3001) in your browser.

## Available Scripts

*   `dev`: Runs the app in development mode.
*   `build`: Creates an optimized production build.
*   `start`: Starts the production server (after running `build`).
*   `lint`: Runs ESLint.

## Project Structure (Key Folders)
dayssince-frontend/
├── public/ # Static assets
├── src/
│ ├── app/ # Next.js App Router (layouts, pages, providers)
│ ├── components/ # Reusable UI components (Layout, Counters, Forms)
│ ├── lib/ # Utility functions, API client config
│ ├── stores/ # Zustand state management stores
│ ├── styles/ # Global styles (if needed beyond Mantine)
│ ├── theme.ts # Mantine theme configuration
│ └── types/ # TypeScript type definitions
├── .env.example # Example environment variables (if any)
├── .eslintrc.json # ESLint config
├── .gitignore # Git ignore rules
├── next.config.mjs # Next.js config
├── package.json # Project dependencies and scripts
├── postcss.config.mjs # PostCSS config for Mantine
└── tsconfig.json # TypeScript config

## Next Steps / TODO

*   Implement live timer display.
*   Implement Create/Edit/Delete/Archive counter forms and API mutations.
*   Implement Tags fetching and selection.
*   Implement Explore page features.
*   Implement Refresh Token flow.
*   UI Polish and Animations.
*   Testing (Unit, Integration, E2E).