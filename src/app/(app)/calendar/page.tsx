import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { getCalendarEvents } from "@/lib/data";
import { CalendarView } from "@/components/calendar-view";

export default async function CalendarPage() {
  const now = new Date();
  // Tight window = faster query (prev month → +2 months)
  const from = startOfMonth(subMonths(now, 1)).toISOString();
  const to = endOfMonth(addMonths(now, 2)).toISOString();
  const events = await getCalendarEvents(from, to);

  return (
    <div className="page-shell max-w-4xl">
      <header className="mb-6 sm:mb-8">
        <p className="section-label">Plan</p>
        <h1 className="page-title mt-2">Calendar</h1>
        <p className="page-subtitle">Tap a day to see what’s on.</p>
      </header>
      <CalendarView events={events} />
    </div>
  );
}
