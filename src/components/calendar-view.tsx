"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarEvent } from "@/lib/types";
import { createCalendarEvent, deleteCalendarEvent } from "@/app/actions/calendar";

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = format(parseISO(ev.start_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const monthKey = format(cursor, "yyyy-MM");
  const monthEvents = events.filter(
    (ev) => format(parseISO(ev.start_at), "yyyy-MM") === monthKey,
  );

  const dayEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {monthEvents.length} event{monthEvents.length === 1 ? "" : "s"} this month
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "Close" : "New event"}
        </button>
      </div>

      {showForm ? (
        <form
          action={(fd) => {
            startTransition(async () => {
              await createCalendarEvent(fd);
              setShowForm(false);
            });
          }}
          className="soft-panel grid gap-3 sm:grid-cols-2"
        >
          <input
            name="title"
            placeholder="Event title"
            required
            className="field sm:col-span-2"
          />
          <textarea
            name="description"
            placeholder="Details (optional)"
            rows={2}
            className="field sm:col-span-2"
          />
          <input type="datetime-local" name="startAt" required className="field" />
          <input type="datetime-local" name="endAt" className="field" />
          <label className="flex items-center gap-2 text-sm text-stone-600 sm:col-span-2 dark:text-stone-300">
            <input type="checkbox" name="allDay" />
            All day
          </label>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary sm:col-span-2"
          >
            {pending ? "Saving…" : "Add event"}
          </button>
        </form>
      ) : null}

      <div className="soft-panel p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            className="btn-quiet"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="text-base font-semibold sm:text-lg">
            {format(cursor, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            className="btn-quiet"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px text-center text-[10px] font-medium tracking-wide text-stone-400 uppercase sm:text-xs">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={`${d}-${i}`} className="py-2">
              <span className="sm:hidden">{d}</span>
              <span className="hidden sm:inline">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEv = eventsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            const selected = selectedDay === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={`min-h-11 rounded-xl p-1 text-left transition sm:min-h-20 sm:p-1.5 ${
                  inMonth ? "bg-stone-50 dark:bg-stone-800/50" : "opacity-35"
                } ${today && !selected ? "ring-1 ring-stone-400" : ""} ${
                  selected ? "chip-active" : ""
                }`}
              >
                <span
                  className={`text-xs font-medium sm:text-sm ${
                    selected ? "" : "text-stone-700 dark:text-stone-200"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayEv.length > 0 ? (
                  <span
                    className={`mt-1 block h-1 w-1 rounded-full sm:mt-1.5 ${
                      selected ? "bg-white dark:bg-stone-900" : "bg-indigo-500"
                    }`}
                  />
                ) : null}
                <ul className="mt-1 hidden space-y-0.5 sm:block">
                  {dayEv.slice(0, 2).map((ev) => (
                    <li
                      key={ev.id}
                      className="truncate rounded px-1 text-[10px] text-white"
                      style={{ backgroundColor: ev.color }}
                    >
                      {ev.title}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay ? (
        <section className="soft-panel">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {format(parseISO(selectedDay), "EEE, MMM d")}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="btn-quiet text-xs"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-2">
            {dayEvents.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start gap-3 rounded-xl bg-stone-50 px-3 py-2.5 dark:bg-stone-800/60"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ev.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{ev.title}</p>
                  <p className="text-xs text-stone-500">
                    {format(parseISO(ev.start_at), "p")}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-600/80"
                  onClick={() =>
                    startTransition(() => deleteCalendarEvent(ev.id))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
            {dayEvents.length === 0 ? (
              <li className="text-sm text-stone-500">No events this day.</li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
