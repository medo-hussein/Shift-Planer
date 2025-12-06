# ShiftMind Frontend Client

This is the frontend client for the ShiftMind application, built with **React 19**, **Vite**, and **Tailwind CSS v4**.

## 🚀 Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── api/             # API configuration & services
│   │   ├── apiClient.js # Axios instance with interceptors
│   │   └── services/    # API service functions
│   ├── components/      # Reusable UI components
│   ├── contexts/        # Global state (Auth, Loader, Theme)
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components (Views)
│   ├── routes/          # Routing configuration
│   │   ├── AppRouter.jsx # Main router logic
│   │   └── routesConfig.js # Role-based route definitions
│   ├── shared/          # Shared constants/utils
│   ├── utils/           # Helper functions
│   ├── App.jsx          # Main App component
│   ├── main.jsx         # Entry point (Providers)
│   └── index.css        # Global styles & Tailwind setup
├── index.html           # HTML entry point
├── package.json         # Dependencies & scripts
└── vite.config.js       # Vite configuration
```

## 🛠️ Key Technologies

-   **Framework:** React 19 + Vite
-   **Styling:** Tailwind CSS v4 (configured in `src/index.css`)
-   **Routing:** React Router v7
-   **State Management:** React Context API (`AuthContext`, `LoaderContext`)
-   **HTTP Client:** Axios (with interceptors for JWT)
-   **UI Libraries:**
    -   `lucide-react`: Icons
    -   `sweetalert2`: Alert modals
    -   `react-hot-toast`: Toast notifications
    -   `framer-motion`: Animations
    -   `@fullcalendar/*`: Calendar functionality

## 🔐 Authentication & Security

Authentication is handled via `AuthContext` and `apiClient.js`.

1.  **JWT Handling:** Access tokens are stored in `localStorage`.
2.  **Interceptors:** `apiClient.js` automatically attaches the token to requests.
3.  **Refresh Logic:** If a 401 response is received, the interceptor attempts to refresh the token via `/api/auth/refresh` and retries the original request.
4.  **Protected Routes:** `ProtectedRoute` and `VerifiedRoute` components ensure only authenticated and verified users can access specific pages.

## 🎨 Styling

We use **Tailwind CSS v4**. Custom utility classes are defined in `src/index.css` for consistency:

-   `.btn`: Standard primary button.
-   `.btn2`: Secondary/Outline button.
-   `.card`: Standard card container with shadow and hover effect.
-   `.dashboardBtn`: Dashboard action button.

## 🚦 Routing

Routing is centralized in `src/routes/AppRouter.jsx`.
Routes are defined based on user roles (`super_admin`, `admin`, `employee`) in `src/routes/routesConfig.js`.

## 📦 Scripts

-   `npm run dev`: Start development server.
-   `npm run build`: Build for production.
-   `npm run preview`: Preview production build.
-   `npm run lint`: Run ESLint.
