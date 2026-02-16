import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const { register, error, setError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const payload = { name, email, password, role };
    if (role === 'student') {
      payload.studentId = studentId || undefined;
      payload.department = department || undefined;
    }
    const result = await register(payload);
    if (result.success) {
      navigate(result.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="flex items-center justify-center gap-2 mb-8">
        <Calendar className="w-10 h-10 text-blue-600" />
        <span className="text-2xl font-bold text-slate-800">SOTConnect</span>
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">Create account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="student">Student</option>
              <option value="admin">Admin / Faculty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Your name"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
          </div>
          {role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (optional)</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. SOT2024001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department (optional)</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. CSE"
                />
              </div>
            </>
          )}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
          >
            Sign up
          </button>
        </form>
        <p className="mt-6 text-center text-slate-600 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
