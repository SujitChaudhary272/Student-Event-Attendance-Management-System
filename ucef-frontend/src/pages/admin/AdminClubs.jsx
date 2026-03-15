import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND}/api/admin/clubs`)
      .then(res => res.json())
      .then(data => setClubs(data))
      .catch(() => setClubs([]));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">All Clubs</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {clubs.map(club => (
          <div
            key={club._id}
            onClick={() => navigate(`/admin/clubs/${club._id}`)}
            className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{club.name}</h2>
            <p className="text-sm text-gray-500 mt-2">
              {club.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}