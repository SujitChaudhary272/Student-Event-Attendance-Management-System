import React, { useMemo } from "react";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const { clubId } = useParams(); // ✅ important

  /* ---------------- DATE & TIME ---------------- */

  // Support both DB formats
  const start = event.start_time
    ? new Date(event.start_time)
    : new Date(`${event.date} ${event.time || "00:00"}`);

  const end = event.end_time
    ? new Date(event.end_time)
    : start;

  const isPast = end < new Date();

  const dateStr = useMemo(
    () => start.toLocaleDateString("en-IN", { dateStyle: "medium" }),
    [start]
  );

  const timeStr = useMemo(() => {
    if (!event.start_time) return event.time || "—";
    const s = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${s} – ${e}`;
  }, [start, end, event.time]);

  /* ---------------- IMAGE HANDLING ---------------- */

  const normalizeImage = (raw) => {
    if (!raw) return "/event-placeholder.jpg";
    if (raw.startsWith("http")) return raw;
    if (raw.startsWith("/uploads")) return `${BACKEND}${raw}`;
    return `${BACKEND}/${raw}`;
  };

  const imageUrl = normalizeImage(event.image_url || event.imageUrl);
  const venue = event.venue || event.location || "PCCOE Campus";

  const registered = event.registered_count ?? event.registered ?? 0;
  const capacity = event.capacity ?? 200;
  const isFull = registered >= capacity;

  /* ---------------- ACTIONS ---------------- */

  const handleExploreClick = () => {
    navigate(`/event/${event.id}`); // back to club page
  };

  const handleRegisterClick = () => {
    if (isPast || isFull) return;
    navigate(`/club/${clubId}/event/${event.id}/join`);
  };

  /* ---------------- UI ---------------- */

  return (
    <div
      className={`ucef-card ucef-card-hover overflow-hidden ${
        isPast ? "opacity-70" : ""
      }`}
    >
      <img
        src={imageUrl}
        alt={event.title}
        className="w-full h-48 object-cover"
        onError={(e) => (e.currentTarget.src = "/event-placeholder.jpg")}
      />

      <div className="p-6">
        <h3 className="text-lg font-bold mb-2 text-slate-900">{event.title}</h3>

        <p className="text-slate-500 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="mb-5 space-y-2 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {dateStr}
          </p>

          <p className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> {timeStr}
          </p>

          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {venue}
          </p>

          <p className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {registered}/{capacity} registered
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={handleExploreClick}
            className="ucef-primary-btn flex-1 !rounded-lg !py-2"
          >
            Explore
          </button>

          <button
            onClick={handleRegisterClick}
            disabled={isPast || isFull}
            className={`flex-1 py-2 rounded-lg font-medium ${
              isPast
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : isFull
                ? "bg-amber-100 text-amber-700 cursor-not-allowed"
                : "bg-[linear-gradient(135deg,#0ea5e9,#38bdf8)] text-white shadow-[0_14px_28px_rgba(14,165,233,0.22)] hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(14,165,233,0.28)]"
            }`}
          >
            {isPast ? "Ended" : isFull ? "Full" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
