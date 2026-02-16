import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../services/api';

const CATEGORIES = ['Workshop', 'Hackathon', 'Seminar', 'Cultural', 'Other'];

export default function AdminEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    venueMapUrl: '',
    date: '',
    capacity: 50,
    category: 'Other',
    tags: '',
    coverImageUrl: '',
    registrationStart: '',
    registrationEnd: '',
    unregisterDeadlineHours: '',
    isDraft: true,
    attachments: [],
  });

  const toDatetimeLocal = (d) => {
    if (!d) return '';
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    const h = String(x.getHours()).padStart(2, '0');
    const min = String(x.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  useEffect(() => {
    if (isEdit) {
      eventsApi.getById(id).then(({ data }) => {
        setForm({
          title: data.title,
          description: data.description || '',
          venue: data.venue,
          venueMapUrl: data.venueMapUrl || '',
          date: toDatetimeLocal(data.date),
          capacity: data.capacity ?? 50,
          category: data.category || 'Other',
          tags: (data.tags || []).join(', '),
          coverImageUrl: data.coverImageUrl || '',
          registrationStart: toDatetimeLocal(data.registrationStart),
          registrationEnd: toDatetimeLocal(data.registrationEnd),
          unregisterDeadlineHours: data.unregisterDeadlineHours ?? '',
          isDraft: data.isDraft ?? true,
          attachments: data.attachments || [],
        });
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        venue: form.venue,
        venueMapUrl: form.venueMapUrl || undefined,
        date: new Date(form.date).toISOString(),
        capacity: Number(form.capacity),
        category: form.category,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        coverImageUrl: form.coverImageUrl || undefined,
        registrationStart: form.registrationStart ? new Date(form.registrationStart).toISOString() : undefined,
        registrationEnd: form.registrationEnd ? new Date(form.registrationEnd).toISOString() : undefined,
        unregisterDeadlineHours: form.unregisterDeadlineHours ? Number(form.unregisterDeadlineHours) : undefined,
        isDraft: form.isDraft,
        attachments: Array.isArray(form.attachments) ? form.attachments : [],
      };
      if (isEdit) {
        await eventsApi.update(id, payload);
      } else {
        await eventsApi.create(payload);
      }
      navigate('/admin/events');
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addAttachment = () => {
    setForm((f) => ({ ...f, attachments: [...(f.attachments || []), { name: '', url: '' }] }));
  };
  const updateAttachment = (i, field, value) => {
    setForm((f) => ({
      ...f,
      attachments: f.attachments.map((a, j) => (j === i ? { ...a, [field]: value } : a)),
    }));
  };
  const removeAttachment = (i) => {
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {isEdit ? 'Edit event' : 'New event'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. Python, Placements"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (Markdown supported)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows={4}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cover image URL</label>
          <input
            type="url"
            value={form.coverImageUrl}
            onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="https://..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue *</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Venue map URL</label>
            <input
              type="url"
              value={form.venueMapUrl}
              onChange={(e) => setForm((f) => ({ ...f, venueMapUrl: e.target.value }))}
              placeholder="Google Maps link"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date & time *</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacity *</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Registration opens</label>
            <input
              type="datetime-local"
              value={form.registrationStart}
              onChange={(e) => setForm((f) => ({ ...f, registrationStart: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Registration closes</label>
            <input
              type="datetime-local"
              value={form.registrationEnd}
              onChange={(e) => setForm((f) => ({ ...f, registrationEnd: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unregister deadline (hours before event)</label>
          <input
            type="number"
            min={0}
            value={form.unregisterDeadlineHours}
            onChange={(e) => setForm((f) => ({ ...f, unregisterDeadlineHours: e.target.value }))}
            placeholder="e.g. 24"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDraft}
              onChange={(e) => setForm((f) => ({ ...f, isDraft: e.target.checked }))}
            />
            <span className="text-sm font-medium text-slate-700">Save as draft (hidden from students until published)</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Attachments</label>
          {(form.attachments || []).map((a, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={a.name}
                onChange={(e) => updateAttachment(i, 'name', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <input
                type="url"
                placeholder="URL"
                value={a.url}
                onChange={(e) => updateAttachment(i, 'url', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <button type="button" onClick={() => removeAttachment(i)} className="px-2 text-red-600">×</button>
            </div>
          ))}
          <button type="button" onClick={addAttachment} className="text-sm text-blue-600 hover:underline">
            + Add attachment
          </button>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
