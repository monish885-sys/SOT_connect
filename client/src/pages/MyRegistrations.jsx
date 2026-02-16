import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, QrCode, Award, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { usersApi, eventsApi } from '../services/api';

export default function MyRegistrations() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(null);
  const [code, setCode] = useState({});
  const [certLoading, setCertLoading] = useState(null);

  useEffect(() => {
    usersApi.getMyRegistrations()
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const fetchCode = (eventId) => {
    if (code[eventId]) {
      setShowQr(showQr === eventId ? null : eventId);
      return;
    }
    eventsApi.getCheckInCode(eventId).then(({ data }) => {
      setCode((c) => ({ ...c, [eventId]: data.code }));
      setShowQr(eventId);
    }).catch(() => alert('Could not load QR code'));
  };

  const downloadCertificate = async (eventId) => {
    setCertLoading(eventId);
    try {
      const { data } = await eventsApi.getCertificate(eventId);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${eventId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Certificate not available');
    } finally {
      setCertLoading(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const canUnregister = (event) => {
    if (!event.unregisterDeadlineHours) return true;
    const deadline = new Date(event.date);
    deadline.setHours(deadline.getHours() - event.unregisterDeadlineHours);
    return new Date() <= deadline;
  };

  const isPast = (d) => new Date(d) < new Date();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Registrations</h1>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>You haven't registered for any events yet.</p>
          <Link to="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">Browse events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const past = isPast(event.date);
            return (
              <div
                key={event._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link to={`/events/${event._id}`} className="font-semibold text-slate-800 hover:text-blue-600">
                      {event.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.registeredCount} / {event.capacity}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Registered
                    </span>
                    {event.checkedIn && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        Checked in
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fetchCode(event._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    <QrCode className="w-4 h-4" /> Show check-in QR
                  </button>
                  {(past || event.checkedIn) && (
                    <button
                      type="button"
                      onClick={() => downloadCertificate(event._id)}
                      disabled={certLoading === event._id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-100 hover:bg-amber-200 rounded-lg disabled:opacity-50"
                    >
                      {certLoading === event._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      Download certificate
                    </button>
                  )}
                  {!past && canUnregister(event) && (
                    <Link to={`/events/${event._id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                      Unregister (on event page)
                    </Link>
                  )}
                </div>
                {showQr === event._id && code[event._id] && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg inline-block">
                    <p className="text-sm text-slate-600 mb-2">Show this QR at the event for check-in</p>
                    <QRCodeSVG value={code[event._id]} size={160} level="M" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
