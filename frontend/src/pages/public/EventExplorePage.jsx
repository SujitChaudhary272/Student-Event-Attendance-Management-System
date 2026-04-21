import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const EventExplorePage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${BACKEND}/api/public/events/${eventId}`);
        const data = await res.json();

        if (!res.ok || data?.error) {
          setEvent(null);
          return;
        }

        setEvent(data);
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const start = useMemo(() => (event?.start_time ? new Date(event.start_time) : null), [event]);
  const end = useMemo(() => (event?.end_time ? new Date(event.end_time) : null), [event]);
  const isPast = end ? end < new Date() : false;

  const normalizeImage = (raw) => {
    if (!raw) return "/event-placeholder.jpg";
    if (raw.startsWith("http")) return raw;
    if (raw.startsWith("uploads/")) return `${BACKEND}/${raw}`;
    if (raw.startsWith("/uploads/")) return `${BACKEND}${raw}`;
    return `${BACKEND}/${raw}`;
  };

  if (loading) {
    return <div className="ucef-page-shell grid place-items-center">Loading event details...</div>;
  }

  if (!event) {
    return <div className="ucef-page-shell grid place-items-center text-rose-600">Event not found</div>;
  }

  const banner = normalizeImage(event.image_url);
  const venue = event.venue || "PCCOE Campus";

  return (
    <div className="ucef-page-shell">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <button
          onClick={() => navigate(-1)}
          className="ucef-back-btn"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>
      </div>

      <section className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-white/80 shadow-[0_28px_72px_rgba(37,99,235,0.16)]">
        <div className="relative h-[320px] overflow-hidden">
          <img
            src={banner}
            alt={event.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/event-placeholder.jpg";
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.65))]" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <p className="text-sm uppercase tracking-[0.25em] text-blue-50/80">Event Details</p>
            <h1 className="mt-3 text-4xl font-bold">{event.title}</h1>
            <p className="mt-2 text-lg text-blue-50/90">{event.club_name || `Club: ${event.club_id}`}</p>
            <span className="mt-4 inline-block rounded-full bg-white/90 px-4 py-1 font-medium text-blue-700">
              {event.status}
            </span>
          </div>
        </div>

        <section className="bg-white/95 px-8 py-10">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900">About the Event</h2>
          <div className="ucef-card mb-6 p-4">
            <p className="text-justify text-slate-600">{event.description}</p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="ucef-card p-4">
              <h3 className="font-semibold text-slate-900">Event Type</h3>
              <p className="mt-1 text-slate-600">{event.event_type}</p>
            </div>
            <div className="ucef-card p-4">
              <h3 className="font-semibold text-slate-900">Venue</h3>
              <p className="mt-1 text-slate-600">{venue}</p>
            </div>
            <div className="ucef-card p-4">
              <h3 className="font-semibold text-slate-900">Start Time</h3>
              <p className="mt-1 text-slate-600">{start ? start.toLocaleString() : "-"}</p>
            </div>
            <div className="ucef-card p-4">
              <h3 className="font-semibold text-slate-900">End Time</h3>
              <p className="mt-1 text-slate-600">{end ? end.toLocaleString() : "-"}</p>
            </div>
          </div>

          <div className="ucef-card mb-6 p-5">
            <h3 className="font-semibold text-slate-900">Registration Stats</h3>
            <p className="mt-2 text-slate-600">
              {(event.registered_count ?? 0)}/{event.capacity ?? 200} registered
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              disabled={isPast}
              onClick={() => navigate(`/club/${event.club_id}/event/${event.id}/join`)}
              className={`rounded-2xl px-6 py-3 font-semibold transition ${
                isPast
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_16px_34px_rgba(37,99,235,0.22)] hover:-translate-y-1"
              }`}
            >
              {isPast ? "Event Ended" : "Register"}
            </button>

            {isPast && (
              <p className="self-center text-sm text-slate-500">
                Registration closed because the event has ended.
              </p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
};

export default EventExplorePage;
