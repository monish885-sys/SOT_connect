import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import MyRegistrations from './pages/MyRegistrations';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminEventForm from './pages/AdminEventForm';
import EventRegistrations from './pages/EventRegistrations';
import EventDetail from './pages/EventDetail';
import CalendarPage from './pages/CalendarPage';

function App() {
  const { fetchUser, loading, user } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Navigate to="/login" replace />} />
        <Route path="login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
        <Route path="signup" element={user ? <Navigate to="/" replace /> : <Signup />} />

        <Route path="dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        <Route path="calendar" element={<ProtectedRoute role="student"><CalendarPage /></ProtectedRoute>} />
        <Route path="registrations" element={<ProtectedRoute role="student"><MyRegistrations /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/events" element={<ProtectedRoute role="admin"><AdminEvents /></ProtectedRoute>} />
        <Route path="admin/events/new" element={<ProtectedRoute role="admin"><AdminEventForm /></ProtectedRoute>} />
        <Route path="admin/events/:id/edit" element={<ProtectedRoute role="admin"><AdminEventForm /></ProtectedRoute>} />
        <Route path="admin/events/:id/registrations" element={<ProtectedRoute role="admin"><EventRegistrations /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
