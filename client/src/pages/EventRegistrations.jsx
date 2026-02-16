import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Download, CheckCircle } from 'lucide-react';
import { eventsApi } from '../services/api';

export default function EventRegistrations() {
  const { id } = useParams();
  const [data, setData] = useState({ registrations: [], waitlist: [], event: null });
  const [loading, setLoading] = useState(true);
  const [checkInCode, setCheckInCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    eventsApi.getRegistrations(id).then(({ data: res }) => setData(res)).finally(() => setLoading(false));
  }, [id]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;
    setChecking(true);
    setMessage('');
    try {
      await eventsApi.checkIn(id, { code: checkInCode.trim() });
      setMessage('Checked in successfully');
      setCheckInCode('');
      const { data: res } = await eventsApi.getRegistrations(id);
      setData(res);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-in failed');
    } finally {
      setChecking(false);
    }
  };

  const handleExport = () => {
    eventsApi.exportRegistrations(id).then(({ data: blob }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }).catch(() => alert('Export failed'));
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  const { registrations, event } = data;

  return (
    <div>
      <Link to="/admin/events" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to events
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Registrations: {event?.title}
      </h1>
      {event?.date && (
        <p className="text-slate-500 mb-6">{formatDate(event.date)}</p>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <form onSubmit={handleCheckIn} className="flex gap-2 items-center">
          <input
            type="text"
            value={checkInCode}
            onChange={(e) => setCheckInCode(e.target.value)}
            placeholder="Paste QR code or enter eventId:userId"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64"
          />
          <button type="submit" disabled={checking} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 disabled:opacity-50">
            {checking ? '...' : 'Check in'}
          </button>
        </form>
        <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      {message && (
        <p className={`mb-4 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>
      )}

      {registrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No registrations yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Student ID</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Department</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Checked in</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((u) => (
                <tr key={u._id} className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-800">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 text-slate-600">{u.studentId || '–'}</td>
                  <td className="py-3 px-4 text-slate-600">{u.department || '–'}</td>
                  <td className="py-3 px-4">
                    {u.checkedIn ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Yes</span> : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
