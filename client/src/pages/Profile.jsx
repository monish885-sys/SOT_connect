import { useState, useEffect } from 'react';
import { User, Mail, Hash, Building2, Phone } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usersApi } from '../services/api';

export default function Profile() {
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', studentId: '', department: '', phone: '' });

  useEffect(() => {
    usersApi.getProfile()
      .then(({ data }) => {
        setUser(data);
        setForm({
          name: data.name || '',
          studentId: data.studentId || '',
          department: data.department || '',
          phone: data.phone || '',
        });
      })
      .catch(() => setMessage('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await usersApi.updateProfile(form);
      setUser(data);
      setMessage('Profile updated.');
    } catch {
      setMessage('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Profile</h1>
      <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{user?.name}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user?.email}
              </p>
              <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700 capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>
          {authUser?.role === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.studentId}
                    onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
