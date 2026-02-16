import { Link, useNavigate } from 'react-router-dom';
import { Calendar, LayoutDashboard, User, LogOut, PlusCircle, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <Calendar className="w-6 h-6 text-blue-400" />
            SOTConnect
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                {isAdmin() ? (
                  <>
                    <Link to="/admin" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/admin/events" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition">
                      <Calendar className="w-4 h-4" /> Events
                    </Link>
                    <Link to="/admin/events/new" className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition">
                      <PlusCircle className="w-4 h-4" /> New Event
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link to="/calendar" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition">
                      <Calendar className="w-4 h-4" /> Calendar
                    </Link>
                    <Link to="/registrations" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition">
                      <ClipboardList className="w-4 h-4" /> My Registrations
                    </Link>
                  </>
                )}
                <Link to="/profile" className="flex items-center gap-1.5 text-slate-200 hover:text-white transition">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-200 hover:text-white transition">Login</Link>
                <Link to="/signup" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
