import React, { useEffect, useState } from "react";
import { fetchClubs, toggleClub, createClub } from "../../services/apiAdmin";
import ClubUpload from "../../components/common/ClubUpload";
import { useNavigate } from "react-router-dom";

export default function ManageClubs() {
  const [clubs, setClubs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    const data = await fetchClubs();
    setClubs(data);
  };

  const addClubHandler = async (formData) => {
    try {
      const res = await createClub(formData);
      alert(res.message);
      loadClubs();
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  const toggleStatus = async (id) => {
    await toggleClub(id);
    loadClubs();
  };

  return (
    <div className="ucef-page-shell px-8 py-6">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="ucef-back-btn"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>
      </div>

      <h1 className="mb-6 text-3xl font-bold">Club Governance</h1>

      <div className="ucef-panel mb-8">
        <h2 className="mb-4 text-lg font-semibold">Register New Club</h2>
        <ClubUpload addClub={addClubHandler} />
      </div>

      <div className="ucef-table">
        <h2 className="border-b p-6 text-xl font-semibold">
          Registered Clubs
        </h2>

        <table className="w-full text-sm">
          <thead className="border-b bg-blue-50/70">
            <tr>
              <th className="p-4 text-left">Logo</th>
              <th className="p-4 text-left">Club Name</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {clubs.map((club) => {
              const logoSrc =
                club.image && club.image.startsWith("http")
                  ? club.image
                  : club.image
                  ? `http://localhost:5000${club.image}`
                  : null;

              return (
                <tr
                  key={club.id}
                  className="border-b border-slate-100 transition hover:bg-blue-50/40"
                >
                  <td className="p-4">
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt="logo"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-400">No Logo</span>
                    )}
                  </td>

                  <td className="p-4 font-semibold">{club.name}</td>
                  <td className="p-4">{club.category}</td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        club.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {club.status}
                    </span>
                  </td>

                  <td className="flex gap-4 p-4">
                    <button
                      onClick={() => toggleStatus(club.id)}
                      className="font-semibold text-blue-700 transition hover:text-cyan-600"
                    >
                      {club.status === "Active" ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => navigate(`/admin/clubs/${club.id}/members`)}
                      className="font-semibold text-sky-700 transition hover:text-blue-500"
                    >
                      Manage Members
                    </button>

                    <button
                      onClick={() => navigate(`/admin/clubs/${club.id}/events`)}
                      className="font-semibold text-emerald-700 transition hover:text-emerald-500"
                    >
                      View Events
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {clubs.length === 0 && (
          <p className="p-6 text-slate-500">No clubs registered yet.</p>
        )}
      </div>
    </div>
  );
}
