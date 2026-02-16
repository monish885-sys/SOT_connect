import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Calendar, MapPin, Users, Loader2, ExternalLink, FileText, Tag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { eventsApi } from '../services/api';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [remindOneDay, setRemindOneDay] = useState(true);

  useEffect(() => {
    if (!id) return;
    eventsApi.getById(id).then(({ data }) => setEvent(data)).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !event) return;
    eventsApi.getRelated(id).then(({ data }) => setRelated(data)).catch(() => setRelated([]));
  }, [id, event]);

  const uid = user?.id || user?._id;
  const isRegistered = event?.registeredUsers?.some((u) => String(u._id) === String(uid));
  const onWaitlist = event?.waitlist?.some((w) => String(w._id || w) === String(uid));
  const full = (event?.registeredUsers?.length || 0) >= (event?.capacity || 0);
  const canUnregister = event?.unregisterDeadlineHours == null || (() => {
    const d = new Date(event.date);
    d.setHours(d.getHours() - event.unregisterDeadlineHours);
    return new Date() <= d;
  })();
  const regOpen = () => {
    const now = new Date();
    if (event?.registrationStart && now < new Date(event.registrationStart)) return false;
    if (event?.registrationEnd && now > new Date(event.registrationEnd)) return false;
    return true;
  };

  const handleRegister = async () => {
    setActionLoading(true);
    try {
      const { data } = await eventsApi.register(id, { remindOneDayBefore: remindOneDay });
      setEvent(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setActionLoading(true);
    try {
      const { data } = await eventsApi.joinWaitlist(id);
      setEvent(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!canUnregister) return;
    setActionLoading(true);
    try {
      const { data } = await eventsApi.unregister(id);
      setEvent(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : '');

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Event not found.</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/dashboard" className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Back to events</Link>

      {event.coverImageUrl && (
        <img src={event.coverImageUrl} alt="" className="w-full h-48 object-cover rounded-xl mb-6" />
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-sm font-medium">{event.category || 'Other'}</span>
        {(event.tags || []).map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm">
            <Tag className="w-3 h-3" />{t}
          </span>
        ))}
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-4">{event.title}</h1>

      <div className="flex flex-wrap gap-4 text-slate-600 mb-6">
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {formatDate(event.date)}
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {event.venue}
          {event.venueMapUrl && (
            <a href={event.venueMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Map
            </a>
          )}
        </span>
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {event.registeredUsers?.length || 0} / {event.capacity} registered
          {(event.waitlist?.length || 0) > 0 && <span className="text-amber-600">({event.waitlist.length} on waitlist)</span>}
        </span>
      </div>

      {event.description && (
        <div className="prose prose-slate max-w-none mb-6">
          <ReactMarkdown>{event.description}</ReactMarkdown>
        </div>
      )}

      {event.attachments?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-slate-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Attachments</h3>
          <ul className="space-y-1">
            {event.attachments.map((a, i) => (
              <li key={i}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{a.name}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {user?.role === 'student' && !isPast && regOpen() && (
        <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50">
          {isRegistered ? (
            <>
              <p className="text-green-700 font-medium mb-2">You are registered for this event.</p>
              {canUnregister ? (
                <button onClick={handleUnregister} disabled={actionLoading} className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50">
                  {actionLoading ? '...' : 'Unregister'}
                </button>
              ) : (
                <p className="text-slate-500 text-sm">Unregister deadline has passed.</p>
              )}
            </>
          ) : onWaitlist ? (
            <p className="text-amber-700 font-medium">You are on the waitlist. We’ll notify you if a spot opens.</p>
          ) : full ? (
            <button onClick={handleJoinWaitlist} disabled={actionLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50">
              {actionLoading ? '...' : 'Join waitlist'}
            </button>
          ) : (
            <>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={remindOneDay} onChange={(e) => setRemindOneDay(e.target.checked)} />
                <span className="text-sm">Remind me 1 day before</span>
              </label>
              <button onClick={handleRegister} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50">
                {actionLoading ? '...' : 'Register'}
              </button>
            </>
          )}
        </div>
      )}

      {related.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">You might also like</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((e) => (
              <Link key={e._id} to={`/events/${e._id}`} className="block p-4 rounded-xl border border-slate-200 hover:bg-slate-50">
                <p className="font-medium text-slate-800">{e.title}</p>
                <p className="text-sm text-slate-500">{formatDate(e.date)} · {e.venue}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
