import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AdminClubEvents() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/clubs/${clubId}/events`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        setEvents([]);
      }
    };

    load();
  }, [clubId]);

  return (
    <div className="ucef-page-shell px-8 py-6">
      <button
        onClick={() => navigate(-1)}
        className="ucef-back-btn mb-4"
      >
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <h1 className="text-2xl font-bold mb-6">Club Events</h1>

      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => navigate(`/admin/events/${event.id}/participants`)}
            className="cursor-pointer bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{event.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(event.start_time).toLocaleString()} to {new Date(event.end_time).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {event.status}
              </span>
            </div>

            <div className="mt-4 flex gap-3 text-sm text-slate-600">
              <span>Registered: {event.registered_count ?? 0}</span>
              <span>Present: {event.present_total ?? 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
