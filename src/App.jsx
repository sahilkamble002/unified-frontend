import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import CreateEventPage from "./pages/CreateEventPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import TaskDetailPage from "./pages/TaskDetailPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/events" replace />;
  }
  return children;
};

const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

const HomeRedirect = () => {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/events" : "/register"} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      }
    />

    <Route element={<ProtectedLayout />}>
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/new" element={<CreateEventPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
