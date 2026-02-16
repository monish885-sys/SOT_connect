import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, PlusCircle, BarChart3, Download, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { eventsApi, analyticsApi } from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(false);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(({ data }) => {
        setStats(data);
        setAnalyticsError(false);
      })
      .catch(() => {
        setStats({ totalEvents: 0, upcomingEvents: 0, totalRegistrations: 0, eventsThisMonth: 0, totalCheckIns: 0, topEvents: [], byCategory: [], eventsPerMonth: [] });
        setAnalyticsError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    eventsApi.list({ past: 'true' })
      .then(({ data }) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, []);

  const handleExportReport = () => {
    analyticsApi.exportReport().then(({ data }) => {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'events_report.csv';
      a.click();
      URL.revokeObjectURL(url);
    }).catch(() => alert('Export failed'));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  const cards = [
    { label: 'Total events', value: stats?.totalEvents ?? 0, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Upcoming events', value: stats?.upcomingEvents ?? 0, icon: BarChart3, color: 'bg-emerald-500' },
    { label: 'Total registrations', value: stats?.totalRegistrations ?? 0, icon: Users, color: 'bg-violet-500' },
    { label: 'Events this month', value: stats?.eventsThisMonth ?? 0, icon: TrendingUp, color: 'bg-amber-500' },
    { label: 'Check-ins', value: stats?.totalCheckIns ?? 0, icon: Users, color: 'bg-slate-600' },
  ];

  const monthData = (stats?.eventsPerMonth || []).map(({ _id, count }) => ({
    month: _id ? `${_id.month}/${_id.year}` : '',
    count,
  })).filter((d) => d.month);
  const categoryData = (stats?.byCategory || []).map((c) => ({ name: c._id || 'Other', value: c.count }));
  const upcomingFromList = events.filter((e) => new Date(e.date) >= new Date()).slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={handleExportReport} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition">
            <Download className="w-4 h-4" /> Export report
          </button>
          <Link to="/admin/events/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition">
            <PlusCircle className="w-4 h-4" /> New Event
          </Link>
        </div>
      </div>

      {analyticsError && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Analytics could not be loaded. Stats below may be zero. You can still use Events to manage events.</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {monthData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Events per month</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">By category</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {(stats?.topEvents?.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="font-semibold text-slate-800 mb-4">Top events by participation</h2>
          <ul className="space-y-2">
            {stats.topEvents.map((e, i) => (
              <li key={e._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">{e.title}</span>
                <span className="text-slate-500 text-sm">{e.registeredCount ?? 0} / {e.capacity} · {e.date ? new Date(e.date).toLocaleDateString() : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
          <span>Upcoming events</span>
          <Link to="/admin/events" className="text-sm font-normal text-blue-600 hover:underline">View all →</Link>
        </h2>
        {upcomingFromList.length === 0 ? (
          <p className="text-slate-500 text-sm">No upcoming events. <Link to="/admin/events/new" className="text-blue-600 hover:underline">Create one</Link></p>
        ) : (
          <ul className="space-y-2">
            {upcomingFromList.map((e) => (
              <li key={e._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <Link to={`/admin/events/${e._id}/edit`} className="font-medium text-slate-800 hover:text-blue-600">
                  {e.title}
                </Link>
                <span className="text-slate-500 text-sm">
                  {e.registeredUsers?.length ?? e.registeredCount ?? 0} / {e.capacity} · {e.date ? new Date(e.date).toLocaleDateString() : ''}
                  {e.isDraft && <span className="ml-1 text-amber-600">(Draft)</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/events/new" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition">
            <PlusCircle className="w-4 h-4" /> Create event
          </Link>
          <Link to="/admin/events" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition">
            <Calendar className="w-4 h-4" /> Manage events
          </Link>
        </div>
      </div>
    </div>
  );
}
