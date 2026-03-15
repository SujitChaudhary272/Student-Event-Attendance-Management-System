import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AdminClubEvents() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND}/api/admin/clubs/${clubId}/events`)
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(() => setEvents([]));
  }, [clubId]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Club Events</h1>

      <div className="space-y-4">
        {events.map(event => (
          <div
            key={event._id}
            onClick={() => navigate(`/admin/events/${event._id}`)}
            className="cursor-pointer bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{event.title}</h2>
            <p className="text-sm text-gray-500">
              Date: {new Date(event.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}