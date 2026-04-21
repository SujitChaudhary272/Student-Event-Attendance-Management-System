import React, { useMemo } from "react";
import EventCard from "./EventCard";
import { Clock } from "lucide-react";

/* ================= UTIL FUNCTIONS ================= */
const getTimeDiff = (startTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start - now;

  if (diffMs <= 0) return null;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

  return { days, hours };
};

const getCountdownLabel = (startTime) => {
  const diff = getTimeDiff(startTime);
  if (!diff) return null;

  if (diff.days > 0) return `Starts in ${diff.days} day${diff.days > 1 ? "s" : ""}`;
  return `Starts in ${diff.hours} hour${diff.hours > 1 ? "s" : ""}`;
};

/* ================= COMPONENT ================= */
export default function UpcomingEvents({ events }) {
  const upcomingEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];

    return events
      .filter((e) => e.status === "Created")
      .sort(
        (a, b) => new Date(a.start_time) - new Date(b.start_time) // ⏰ nearest first
      );
  }, [events]);

  if (upcomingEvents.length === 0) {
    return (
      <p className="mt-8 text-slate-500">
        No upcoming events right now.
      </p>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {upcomingEvents.map((event) => {
        const label = getCountdownLabel(event.start_time);

        return (
          <div key={event.id} className="relative">
            {/* ⏳ Countdown Badge */}
            {label && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-3 py-1 text-xs text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)]">
                <Clock className="w-3 h-3" />
                {label}
              </div>
            )}

            <EventCard event={event} />
          </div>
        );
      })}
    </div>
  );
}
