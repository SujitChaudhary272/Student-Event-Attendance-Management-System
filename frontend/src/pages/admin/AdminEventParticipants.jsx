import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AdminEventParticipants() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/events/${eventId}/participants`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        setParticipants(Array.isArray(data) ? data : []);
      } catch {
        setParticipants([]);
      }
    };

    load();
  }, [eventId]);

  return (
    <div className="ucef-page-shell px-8 py-6">
      <button
        onClick={() => navigate(-1)}
        className="ucef-back-btn mb-4"
      >
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <h1 className="text-2xl font-bold mb-6">Event Participants</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Roll No</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Year</th>
              <th className="p-3 text-left">Attendance</th>
              <th className="p-3 text-left">Last Scan</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((user) => (
              <tr key={user.student_id} className="border-t">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.roll_no || "—"}</td>
                <td className="p-3">{user.department || "—"}</td>
                <td className="p-3">{user.year || "—"}</td>
                <td className="p-3">
                  {user.attendance_status === "Present" ? (
                    <span className="text-green-600 font-semibold">Present</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Absent</span>
                  )}
                </td>
                <td className="p-3">
                  {user.last_scanned_at ? new Date(user.last_scanned_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
