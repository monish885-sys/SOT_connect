import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Edit2, Trash2, List, Copy, Download } from 'lucide-react';
import { eventsApi } from '../services/api';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    eventsApi.list({ past: 'true' }).then(({ data }) => setEvents(data)).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const idStr = String(id);
    setDeleting(idStr);
    try {
      await eventsApi.delete(idStr);
      setEvents((prev) => prev.filter((e) => String(e._id) !== idStr));
      setSelected((s) => {
        const next = new Set(s);
        next.delete(idStr);
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (event) => {
    try {
      const newDate = prompt('New date (YYYY-MM-DDTHH:mm) or leave blank to keep same:', event.date ? new Date(event.date).toISOString().slice(0, 16) : '');
      const { data } = await eventsApi.duplicate(event._id, newDate ? { newDate } : {});
      setEvents((prev) => [data, ...prev]);
    } catch (err) {
      alert(err.response?.data?.message || 'Duplicate failed');
    }
  };

  const handleExport = async (eventId) => {
    try {
      const { data } = await eventsApi.exportRegistrations(eventId);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
  };

  const toggleSelect = (id) => {
    const idStr = String(id);
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === events.length) setSelected(new Set());
    else setSelected(new Set(events.map((e) => String(e._id))));
  };

  const runBulk = async () => {
    if (!bulkAction || selected.size === 0) return;
    const idList = [...selected];
    try {
      await eventsApi.bulk(bulkAction, idList);
      if (bulkAction === 'delete') {
        setEvents((prev) => prev.filter((e) => !selected.has(String(e._id))));
        setSelected(new Set());
      } else {
        setEvents((prev) => prev.map((e) => (selected.has(String(e._id)) ? { ...e, isDraft: bulkAction === 'unpublish' } : e)));
      }
      setBulkAction('');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Bulk action failed');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Events</h1>
        <Link
          to="/admin/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
        >
          New Event
        </Link>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-100 rounded-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="px-3 py-1.5 rounded border border-slate-300 text-sm"
          >
            <option value="">Bulk action</option>
            <option value="publish">Publish</option>
            <option value="unpublish">Unpublish</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={runBulk} disabled={!bulkAction} className="px-3 py-1.5 bg-slate-700 text-white rounded text-sm hover:bg-slate-600 disabled:opacity-50">
            Apply
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-slate-600 hover:underline">Clear</button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No events yet.</p>
          <Link to="/admin/events/new" className="mt-4 inline-block text-blue-600 hover:underline">Create one</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-10 py-3 px-2">
                  <input type="checkbox" checked={events.length > 0 && selected.size === events.length} onChange={selectAll} title="Select all" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Event</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Venue</th>
                <th className="text-left py-3 px-4 font-medium text-slate-700">Registrations</th>
                <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-3 px-2">
                    <input
                      type="checkbox"
                      checked={selected.has(String(event._id))}
                      onChange={() => toggleSelect(event._id)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">{event.title}</p>
                    {event.isDraft && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">Draft</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(event.date)}</td>
                  <td className="py-3 px-4 text-slate-600">{event.venue}</td>
                  <td className="py-3 px-4">
                    <Link to={`/admin/events/${event._id}/registrations`} className="text-blue-600 hover:underline">
                      {event.registeredUsers?.length ?? event.registeredCount ?? 0} / {event.capacity}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleExport(event._id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Export CSV">
                        <Download className="w-4 h-4" />
                      </button>
                      <Link to={`/admin/events/${event._id}/registrations`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Registrations">
                        <List className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDuplicate(event)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <Link to={`/admin/events/${event._id}/edit`} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(event._id, event.title)}
                        disabled={deleting === String(event._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
