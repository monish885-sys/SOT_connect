import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { eventsApi } from '../services/api';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-IN': enIN } });

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = showAll ? { past: 'true' } : {};
    eventsApi.list(params)
      .then(({ data }) => setEvents(data))
      .finally(() => setLoading(false));
  }, [showAll]);

  const calendarEvents = events.map((e) => ({
    id: e._id,
    title: e.title,
    start: new Date(e.date),
    end: new Date(new Date(e.date).getTime() + 60 * 60 * 1000),
    resource: e,
  }));

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
        <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Include past events
        </label>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[500px]">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          style={{ height: 500 }}
          onSelectEvent={(ev) => window.location.href = `/events/${ev.resource._id}`}
          eventPropGetter={() => ({ style: { backgroundColor: '#3b82f6' } })}
        />
      </div>
      <p className="mt-4 text-sm text-slate-500">Click an event to open its details.</p>
    </div>
  );
}
