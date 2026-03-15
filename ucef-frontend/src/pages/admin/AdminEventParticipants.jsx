import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AdminEventParticipants() {
  const { eventId } = useParams();
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND}/api/admin/events/${eventId}/participants`)
      .then(res => res.json())
      .then(data => setParticipants(data))
      .catch(() => setParticipants([]));
  }, [eventId]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Participants</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {participants.map(user => (
              <tr key={user._id} className="border-t">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  {user.attended ? (
                    <span className="text-green-600 font-semibold">
                      Attended
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold">
                      Absent
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}