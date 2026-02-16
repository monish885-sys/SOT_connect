import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Loader2, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { eventsApi } from '../services/api';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('date');
  const [past, setPast] = useState(false);
  const [hasSeats, setHasSeats] = useState(false);
  const [myOnly, setMyOnly] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    eventsApi.getCategories().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { sort, past: past ? 'true' : 'false' };
    if (debouncedSearch) params.q = debouncedSearch;
    if (category) params.category = category;
    if (hasSeats) params.hasSeats = 'true';
    if (myOnly) params.registeredByMe = 'true';
    eventsApi.list(params)
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, sort, past, hasSeats, myOnly]);

  const handleRegister = async (eventId) => {
    setRegistering(eventId);
    try {
      const { data } = await eventsApi.register(eventId);
      setEvents((prev) => prev.map((e) => (e._id === eventId ? data : e)));
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(null);
    }
  };

  const isRegistered = (event) =>
    event.registeredUsers?.some((u) => u._id === (user?.id || user?._id));
  const onWaitlist = (event) => event.waitlist?.some((w) => (w._id || w) === (user?.id || user?._id));

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {past ? 'Past events' : 'Upcoming events'}
        </h1>
        <Link to="/registrations" className="text-blue-600 hover:underline font-medium">
          My Registrations →
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, venue, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="date">Sort by date</option>
          <option value="popularity">Sort by popularity</option>
          <option value="title">Sort by title</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={past} onChange={(e) => setPast(e.target.checked)} />
          Past events
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={hasSeats} onChange={(e) => setHasSeats(e.target.checked)} />
          With seats
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={myOnly} onChange={(e) => setMyOnly(e.target.checked)} />
          My registrations
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No events match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const registered = isRegistered(event);
            const waitlist = onWaitlist(event);
            const full = (event.registeredUsers?.length || 0) >= event.capacity;
            const isPastEvent = new Date(event.date) < new Date();
            return (
              <div
                key={event._id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {event.coverImageUrl && (
                  <Link to={`/events/${event._id}`}>
                    <img src={event.coverImageUrl} alt="" className="w-full h-32 object-cover" />
                  </Link>
                )}
                <div className="p-5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">{event.category || 'Other'}</span>
                  <Link to={`/events/${event._id}`} className="block mt-2 font-semibold text-slate-800 line-clamp-2 hover:text-blue-600">
                    {event.title}
                  </Link>
                  {event.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{event.description}</p>
                  )}
                  <div className="space-y-1.5 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {event.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 shrink-0" />
                      {event.registeredUsers?.length || 0} / {event.capacity}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/events/${event._id}`}
                      className="flex-1 text-center py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      View
                    </Link>
                    {!isPastEvent && (
                      registered ? (
                        <span className="flex-1 text-center py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg">
                          Registered
                        </span>
                      ) : waitlist ? (
                        <span className="flex-1 text-center py-2 text-sm text-amber-700 bg-amber-50 rounded-lg">
                          Waitlist
                        </span>
                      ) : full ? (
                        <span className="flex-1 text-center py-2 text-sm text-slate-500 bg-slate-100 rounded-lg">
                          Full
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRegister(event._id)}
                          disabled={registering === event._id}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
                        >
                          {registering === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
