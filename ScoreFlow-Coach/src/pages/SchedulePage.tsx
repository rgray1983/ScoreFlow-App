import { useMemo, useState, type FormEvent } from 'react';
import ContextBar from '../components/ContextBar';
import DateField from '../components/DateField';
import SelectField from '../components/SelectField';
import SlideOver from '../components/SlideOver';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ScheduleEvent, ScheduleEventInput, ScheduleEventStatus, ScheduleEventType, ScheduleLocationType } from '../types/workspace';

type ScheduleView = 'agenda' | 'month' | 'upcoming';
const eventTypes: ScheduleEventType[] = ['match', 'practice', 'tournament', 'scrimmage', 'team-event'];
const eventStatuses: ScheduleEventStatus[] = ['draft', 'scheduled', 'changed', 'cancelled', 'completed'];
const locationTypes: ScheduleLocationType[] = ['home', 'away', 'neutral'];
const typeLabels: Record<ScheduleEventType, string> = { match: 'Match', practice: 'Practice', tournament: 'Tournament', scrimmage: 'Scrimmage', 'team-event': 'Team Event' };
const typeIcons: Record<ScheduleEventType, string> = { match: 'M', practice: 'P', tournament: 'T', scrimmage: 'S', 'team-event': 'E' };
const timeOptions = [{ value: '', label: 'Not set' }, ...Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4); const minute = (index % 4) * 15;
  const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return { value, label: formatTime(value) };
})];

export default function SchedulePage() {
  const workspace = useWorkspace();
  const [view, setView] = useState<ScheduleView>('agenda');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const selectedEvent = workspace.scheduleEvents.find((item) => item.id === editingId);
  const events = useMemo(() => workspace.scheduleEvents
    .filter((item) => item.teamId === workspace.activeTeamId && item.seasonId === workspace.activeSeasonId)
    .sort((a, b) => `${a.date}T${a.startTime || '23:59'}`.localeCompare(`${b.date}T${b.startTime || '23:59'}`)),
  [workspace.scheduleEvents, workspace.activeTeamId, workspace.activeSeasonId]);
  const canAdd = Boolean(workspace.activeTeamId && workspace.activeSeasonId);

  return <div className="schedule-workspace">
    <ContextBar label="Schedule context" />
    <section className="schedule-toolbar panel">
      <div><p className="eyebrow">Team calendar</p><h2>{workspace.activeTeam?.name ?? 'Select a team'}</h2><p>{workspace.activeSeason?.name ?? 'Select a season'} · {events.length} events</p></div>
      <div className="schedule-toolbar-actions">
        <div className="view-switch" aria-label="Schedule view">{(['agenda', 'month', 'upcoming'] as const).map((item) => <button className={view === item ? 'is-active' : ''} key={item} onClick={() => setView(item)} type="button">{item}</button>)}</div>
        <button className="button button-primary" disabled={!canAdd} onClick={() => setCreating(true)} type="button">＋ Add event</button>
      </div>
    </section>

    {view === 'month' ? <MonthView events={events} month={month} onMonthChange={setMonth} onSelect={setEditingId} /> : <EventList events={view === 'upcoming' ? events.filter((item) => item.date >= todayValue()) : events} onSelect={setEditingId} />}

    <SlideOver open={creating || Boolean(selectedEvent)} title={creating ? 'Add schedule event' : 'Edit schedule event'} onClose={() => { setCreating(false); setEditingId(null); }}>
      <ScheduleEventForm event={selectedEvent} onDone={() => { setCreating(false); setEditingId(null); }} />
    </SlideOver>
  </div>;
}

function EventList({ events, onSelect }: { events: ScheduleEvent[]; onSelect: (id: string) => void }) {
  const grouped = useMemo(() => events.reduce<Record<string, ScheduleEvent[]>>((result, event) => { (result[event.date] ??= []).push(event); return result; }, {}), [events]);
  return <section className="schedule-list-panel panel">
    <header><div><p className="eyebrow">Agenda</p><h3>Schedule</h3></div><span className="sync-pill"><span /> Saved on device</span></header>
    <div className="schedule-agenda">{Object.entries(grouped).map(([date, dayEvents]) => <section className="agenda-day" key={date}>
      <div className="agenda-date"><strong>{new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}</strong><span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))}</span></div>
      <div className="agenda-events">{dayEvents.map((event) => <EventRow event={event} key={event.id} onSelect={onSelect} />)}</div>
    </section>)}{events.length === 0 && <div className="schedule-empty"><span>◇</span><p>No events scheduled for this team and season.</p></div>}</div>
  </section>;
}

function EventRow({ event, onSelect }: { event: ScheduleEvent; onSelect: (id: string) => void }) {
  return <button className={`schedule-row type-${event.type}`} onClick={() => onSelect(event.id)} type="button">
    <span className="event-type-mark">{typeIcons[event.type]}</span>
    <span className="event-copy"><strong>{event.title}</strong><small>{event.opponent ? `${event.opponent} · ` : ''}{event.venue || 'Location not set'}{event.court ? ` · ${event.court}` : ''}</small></span>
    <span className="event-time"><strong>{formatTime(event.startTime)}</strong><small>{event.arrivalTime ? `Arrive ${formatTime(event.arrivalTime)}` : typeLabels[event.type]}</small></span>
    <span className={`event-status status-${event.status}`}>{event.status}</span><span className="player-row-arrow">›</span>
  </button>;
}

function MonthView({ events, month, onMonthChange, onSelect }: { events: ScheduleEvent[]; month: Date; onMonthChange: (date: Date) => void; onSelect: (id: string) => void }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1); const start = new Date(first); start.setDate(1 - first.getDay());
  const days = Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
  return <section className="schedule-month panel"><header><button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} type="button">‹</button><div><p className="eyebrow">Month view</p><h3>{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(month)}</h3></div><button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} type="button">›</button></header><div className="month-weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <span key={day}>{day}</span>)}</div><div className="month-grid">{days.map((day) => { const value = dateValue(day); const dayEvents = events.filter((event) => event.date === value); return <div className={`month-day${day.getMonth() !== month.getMonth() ? ' is-outside' : ''}`} key={value}><span>{day.getDate()}</span><div>{dayEvents.slice(0, 3).map((event) => <button className={`month-event type-${event.type}`} key={event.id} onClick={() => onSelect(event.id)} type="button"><b>{formatTime(event.startTime)}</b> {event.title}</button>)}{dayEvents.length > 3 && <small>+{dayEvents.length - 3} more</small>}</div></div>; })}</div></section>;
}

function ScheduleEventForm({ event, onDone }: { event?: ScheduleEvent; onDone: () => void }) {
  const workspace = useWorkspace();
  function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault(); const data = new FormData(formEvent.currentTarget);
    const input: ScheduleEventInput = { teamId: workspace.activeTeamId, seasonId: workspace.activeSeasonId, type: String(data.get('type')) as ScheduleEventType, title: String(data.get('title') ?? '').trim(), date: String(data.get('date') ?? ''), startTime: String(data.get('startTime') ?? ''), arrivalTime: String(data.get('arrivalTime') ?? ''), endTime: String(data.get('endTime') ?? ''), opponent: String(data.get('opponent') ?? '').trim(), locationType: String(data.get('locationType')) as ScheduleLocationType, venue: String(data.get('venue') ?? '').trim(), address: String(data.get('address') ?? '').trim(), court: String(data.get('court') ?? '').trim(), travelNotes: String(data.get('travelNotes') ?? '').trim(), notes: String(data.get('notes') ?? '').trim(), status: String(data.get('status')) as ScheduleEventStatus };
    if (event) workspace.updateScheduleEvent(event.id, input); else workspace.addScheduleEvent(input); onDone();
  }
  return <form className="schedule-editor-form" onSubmit={submit}>
    <section><p className="form-section-title">Event</p><div className="editor-grid">
      <label><span>Event type</span><SelectField name="type" defaultValue={event?.type ?? 'match'} options={eventTypes.map((value) => ({ value, label: typeLabels[value] }))} /></label>
      <label><span>Status</span><SelectField name="status" defaultValue={event?.status ?? 'scheduled'} options={eventStatuses.map((value) => ({ value, label: capitalize(value) }))} /></label>
      <label className="editor-wide"><span>Title</span><input autoFocus name="title" defaultValue={event?.title} placeholder="Home vs. Camden" required /></label>
      <label><span>Date</span><DateField name="date" defaultValue={event?.date} required /></label>
      <label><span>Location type</span><SelectField name="locationType" defaultValue={event?.locationType ?? 'home'} options={locationTypes.map((value) => ({ value, label: capitalize(value) }))} /></label>
    </div></section>
    <section><p className="form-section-title">Timing</p><div className="editor-grid editor-grid-three">
      <label><span>Start time</span><SelectField name="startTime" defaultValue={event?.startTime ?? ''} options={timeOptions} /></label>
      <label><span>Arrival time</span><SelectField name="arrivalTime" defaultValue={event?.arrivalTime ?? ''} options={timeOptions} /></label>
      <label><span>End time</span><SelectField name="endTime" defaultValue={event?.endTime ?? ''} options={timeOptions} /></label>
    </div></section>
    <section><p className="form-section-title">Details</p><div className="editor-grid">
      <label><span>Opponent</span><input name="opponent" defaultValue={event?.opponent} /></label><label><span>Court</span><input name="court" defaultValue={event?.court} /></label>
      <label className="editor-wide"><span>Venue</span><input name="venue" defaultValue={event?.venue ?? workspace.activeTeam?.homeCourt} /></label>
      <label className="editor-wide"><span>Address</span><input name="address" defaultValue={event?.address} /></label>
      <label className="editor-wide"><span>Travel notes</span><textarea name="travelNotes" defaultValue={event?.travelNotes} rows={2} /></label>
      <label className="editor-wide"><span>Event notes</span><textarea name="notes" defaultValue={event?.notes} rows={3} /></label>
    </div></section>
    <div className="slide-form-actions"><button className="button button-quiet" onClick={onDone} type="button">Cancel</button><button className="button button-primary" type="submit">Save event</button></div>
  </form>;
}

function formatTime(value: string) { if (!value) return 'TBD'; const [hours, minutes] = value.split(':').map(Number); return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes)); }
function dateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function todayValue() { return dateValue(new Date()); }
function capitalize(value: string) { return value.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '); }
