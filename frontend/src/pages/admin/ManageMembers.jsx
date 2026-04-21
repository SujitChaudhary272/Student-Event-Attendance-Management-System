import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  fetchMembers,
  createMember,
  toggleMember,
  updateMemberRole,
  fetchMembersByClub,
} from "../../services/apiMember.js";

import { getClubById } from "../../services/apiClub";

export default function ManageMembers() {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [clubName, setClubName] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Member",
    password: "",
  });

  useEffect(() => {
    if (!clubId) return;

    loadClubName();
    loadMembers();
  }, [clubId]);

  const loadClubName = async () => {
    try {
      const club = await getClubById(clubId);
      setClubName(club.name);
    } catch (err) {
      setClubName("");
      console.error("Failed to fetch club name:", err);
    }
  };

  const loadMembers = async () => {
    const data = clubId ? await fetchMembersByClub(clubId) : await fetchMembers();
    setMembers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clubId) {
      alert("Club ID missing. Please open members page from Manage Clubs.");
      return;
    }

    await createMember({
      ...form,
      club_id: clubId,
    });

    setForm({ name: "", email: "", role: "Member", password: "" });
    loadMembers();
  };

  const toggleStatus = async (id) => {
    await toggleMember(id);
    loadMembers();
  };

  const changeRole = async (id, role) => {
    await updateMemberRole(id, role);
    loadMembers();
  };

  return (
    <div className="ucef-page-shell px-8 py-6">
      <button
        onClick={() => navigate(-1)}
        className="ucef-back-btn mb-4"
      >
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <h1 className="mb-2 text-3xl font-bold">
        Club Members Management
      </h1>
      <p className="mb-6 text-slate-500">
        {clubName ? `Managing members of: ${clubName}` : "Loading club..."}
      </p>

      <div className="ucef-panel mb-8">
        <h2 className="mb-4 text-lg font-semibold">Add New Member</h2>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <input
            type="text"
            value={clubName}
            disabled
            className="ucef-input bg-slate-100 text-slate-600"
            placeholder="Club Name"
          />

          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="ucef-input"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="ucef-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="ucef-input"
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="ucef-input"
          >
            <option>President</option>
            <option>Secretary</option>
            <option>Member</option>
          </select>

          <button
            type="submit"
            className="ucef-primary-btn w-full"
          >
            Add Member to {clubName || "Club"}
          </button>
        </form>
      </div>

      <div className="ucef-table">
        <h2 className="border-b p-6 text-xl font-semibold">
          Members List {clubName ? `- ${clubName}` : ""}
        </h2>

        <table className="w-full text-sm">
          <thead className="border-b bg-blue-50/70">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-slate-100 transition hover:bg-blue-50/40"
              >
                <td className="p-4 font-semibold">{member.name}</td>
                <td className="p-4">{member.email}</td>

                <td className="p-4">
                  <select
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1"
                  >
                    <option>President</option>
                    <option>Secretary</option>
                    <option>Member</option>
                  </select>
                </td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      member.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>

                <td className="p-4">
                  <button
                    onClick={() => toggleStatus(member.id)}
                    className="font-semibold text-blue-700 transition hover:text-cyan-600"
                  >
                    {member.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <p className="p-6 text-slate-500">No members added yet.</p>
        )}
      </div>
    </div>
  );
}
