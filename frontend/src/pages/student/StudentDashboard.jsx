// StudentDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParticipationTimeline from "../../components/participation/ParticipationTimeline";
import CertificateCard from "../../components/participation/CertificateCard";
import StatCard from "../../components/common/StatCard";
import QRScanner from "../../components/common/QRScanner";
import { toast } from "sonner";

import {
  fetchLiveEvents,
  fetchMyParticipation,
  registerForLiveEvent,
} from "../../services/participationService";
import { logout, fetchMyProfile, deleteMyAccount } from "../../services/authStudent";

import {
  LayoutDashboard,
  Clock,
  Award,
  QrCode,
  User,
  LogOut,
  Pencil,
  Save,
  X,
  Menu,
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "certificates", label: "Certificates", icon: Award },
  { key: "qr-scanner", label: "QR Scanner", icon: QrCode },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [participations, setParticipations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [registeringEventId, setRegisteringEventId] = useState(null);

  const loadDashboardData = async ({ withLoader = false } = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/student/login");
      return;
    }

    if (withLoader) setLoading(true);

    try {
      setError("");
      const profileData = await fetchMyProfile();
      setProfile(profileData);

      const data = await fetchMyParticipation();
      const mapped = (data?.records || []).map((r) => ({
        eventId: r.event_id,
        eventName: r.event_title,
        club: r.club_name,
        year: r.start_time ? new Date(r.start_time).getFullYear() : null,
        participationState: r.participation_state,
        attendancePercentage:
          typeof r.attendance_percent === "number"
            ? r.attendance_percent
            : r.attendance_status === "Present"
            ? 100
            : null,
        certificateId: r.certificate_no || null,
        canGenerateCertificate: r.can_generate_certificate === true,
        explanation: r.explanation,
      }));

      setParticipations(mapped);

      const liveEventsData = await fetchLiveEvents();
      setLiveEvents(Array.isArray(liveEventsData?.events) ? liveEventsData.events : []);
    } catch (err) {
      console.error(err);
      if (
        err?.message?.includes("Authentication") ||
        err?.message?.includes("Unauthorized") ||
        err?.message?.includes("Student not found")
      ) {
        logout();
        navigate("/student/login");
        return;
      }
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      if (withLoader) setLoading(false);
    }
  };

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    loadDashboardData({ withLoader: true });
  }, [navigate]);

  /* ================= STATS ================= */
    const stats = useMemo(() => {
      const totalRegistered = participations.length;

      const totalAttended = participations.filter(
        (p) => p.participationState === "Attended" || p.participationState === "Certified"
      ).length;

      const totalCertified = participations.filter(
        (p) => p.participationState === "Certified"
      ).length;

      // Club-wise summary
      const clubMap = new Map();
      for (const p of participations) {
        const key = p.club || "Unknown Club";
        if (!clubMap.has(key)) {
          clubMap.set(key, { club: key, registered: 0, attended: 0, certified: 0 });
        }
        const row = clubMap.get(key);
        row.registered += 1;
        if (p.participationState === "Attended" || p.participationState === "Certified") row.attended += 1;
        if (p.participationState === "Certified") row.certified += 1;
      }
      const clubSummary = Array.from(clubMap.values()).sort((a, b) => b.registered - a.registered);

      // Year-wise summary
      const yearMap = new Map();
      for (const p of participations) {
        const y = p.year || "Unknown";
        if (!yearMap.has(y)) {
          yearMap.set(y, { year: y, registered: 0, attended: 0, certified: 0 });
        }
        const row = yearMap.get(y);
        row.registered += 1;
        if (p.participationState === "Attended" || p.participationState === "Certified") row.attended += 1;
        if (p.participationState === "Certified") row.certified += 1;
      }
      const yearSummary = Array.from(yearMap.values()).sort((a, b) => Number(b.year) - Number(a.year));

      return {
        totalRegistered,
        totalAttended,
        totalCertified,
        clubSummary,
        yearSummary,
      };
    }, [participations]);


  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;

    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your student profile, attendance, registrations, certificates, and related records from the database."
    );

    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      await deleteMyAccount();
      toast.success("Your account was deleted permanently");
      logout();
      window.location.href = "/";
    } catch (err) {
      toast.error(err?.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleRegisterForEvent = async (event) => {
    if (registeringEventId) return;

    setRegisteringEventId(event.id);
    try {
      await registerForLiveEvent({
        clubId: event.club_id,
        eventId: event.id,
        profile,
      });
      toast.success("Registered successfully");
      await loadDashboardData({ withLoader: false });
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Registration failed");
    } finally {
      setRegisteringEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="ucef-page-shell grid place-items-center">
        <div className="ucef-card px-6 py-4">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="ucef-page-shell grid place-items-center px-4">
        <div className="ucef-card max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Could not load dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">
            {error || "Something went wrong while loading your profile."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/student/login")}
            className="ucef-primary-btn mt-4"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ucef-page-shell">

      {/* ================= MOBILE HEADER ================= */}
      <header className="ucef-topbar md:hidden flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
        <p className="font-semibold">Student Dashboard</p>
        <div className="w-6" />
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">

        {/* ================= SIDEBAR ================= */}
        <Sidebar
          profile={profile}
          activeTab={activeTab}
          setActiveTab={(t) => {
            setActiveTab(t);
            setSidebarOpen(false);
          }}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          deletingAccount={deletingAccount}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* ================= MAIN CONTENT ================= */}
        <main className="ucef-card p-5 md:p-6">
          <h1 className="text-3xl font-bold mb-6">
            {TABS.find((t) => t.key === activeTab)?.label}
          </h1>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Registered" value={stats.totalRegistered} />
            <StatCard title="Total Attended" value={stats.totalAttended} />
            <StatCard title="Total Certified" value={stats.totalCertified} />
          </div>

          {/* Year-wise cards */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Year-wise Summary</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Participation breakdown by academic year.
                </p>
              </div>
            </div>

            {stats.yearSummary.length === 0 ? (
              <p className="mt-4 text-slate-500">No participation history yet.</p>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.yearSummary.map((y) => (
                  <div
                    key={String(y.year)}
                    className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"
                  >
                    <p className="text-sm text-slate-500">Year</p>
                    <p className="text-2xl font-bold mt-1">{y.year}</p>

                    <div className="mt-4 space-y-2 text-sm">
                      <RowMini label="Registered" value={y.registered} />
                      <RowMini label="Attended" value={y.attended} />
                      <RowMini label="Certified" value={y.certified} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Club-wise summary */}
          <div className="ucef-table">
            <div className="border-b border-white/70 p-5">
              <h2 className="text-lg font-semibold">Club-wise Summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Participation totals grouped by club.
              </p>
            </div>

            {stats.clubSummary.length === 0 ? (
              <p className="p-6 text-slate-500">No participation history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-blue-50/70 text-slate-600">
                    <tr>
                      <th className="p-4 text-left">Club</th>
                      <th className="p-4 text-center">Registered</th>
                      <th className="p-4 text-center">Attended</th>
                      <th className="p-4 text-center">Certified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.clubSummary.map((c) => (
                      <tr key={c.club} className="border-t border-slate-100 transition hover:bg-blue-50/30">
                        <td className="p-4 font-medium">{c.club}</td>
                        <td className="p-4 text-center">{c.registered}</td>
                        <td className="p-4 text-center">{c.attended}</td>
                        <td className="p-4 text-center">{c.certified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="ucef-table">
            <div className="border-b border-white/70 p-5">
              <h2 className="text-lg font-semibold">Live Events</h2>
              <p className="mt-1 text-sm text-slate-500">
                Register for a live event before scanning its attendance QR.
              </p>
            </div>

            {liveEvents.length === 0 ? (
              <p className="p-6 text-slate-500">No live events are available right now.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {liveEvents.map((event) => {
                  const isRegistered = event.is_registered === true;
                  const isFull =
                    Number(event.registered_count || 0) >= Number(event.capacity || 200);
                  const isRegistering = registeringEventId === event.id;

                  return (
                    <div
                      key={event.id}
                      className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {event.club_name} • {event.venue || "PCCOE Campus"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(event.start_time).toLocaleString()} to{" "}
                          {new Date(event.end_time).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.registered_count}/{event.capacity || 200} registered
                        </p>
                      </div>

                      <button
                        onClick={() => handleRegisterForEvent(event)}
                        disabled={isRegistered || isFull || isRegistering}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                          isRegistered
                            ? "cursor-not-allowed border border-green-200 bg-green-50 text-green-700"
                            : isFull
                            ? "cursor-not-allowed border border-amber-200 bg-amber-50 text-amber-700"
                            : isRegistering
                            ? "cursor-not-allowed bg-blue-300 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isRegistered
                          ? "Registered"
                          : isFull
                          ? "Event Full"
                          : isRegistering
                          ? "Registering..."
                          : "Register"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


          {activeTab === "timeline" && (
            <ParticipationTimeline participations={participations} />
          )}

          {activeTab === "certificates" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {participations.filter(p => p.certificateId || p.canGenerateCertificate).length === 0
                ? <p className="text-slate-500">No certificates yet.</p>
                : participations
                    .filter(p => p.certificateId || p.canGenerateCertificate)
                    .map(p => (
                      <CertificateCard
                        key={p.certificateId || `event-${p.eventId}`}
                        participation={p}
                        onCertificateGenerated={async () => {
                          await loadDashboardData({ withLoader: false });
                        }}
                      />
                    ))}
            </div>
          )}

          {activeTab === "qr-scanner" && (
            <QRScanner
              profile={profile}
              onAttendanceCaptured={async () => {
                await loadDashboardData({ withLoader: false });
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

/* ================= SIDEBAR COMPONENT ================= */
function Sidebar({
  profile,
  activeTab,
  setActiveTab,
  onLogout,
  onDeleteAccount,
  deletingAccount,
  open,
  onClose,
}) {
  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:static z-50 md:z-auto top-0 left-0 h-full w-[280px]
        bg-white/95 md:bg-white/70 border-r border-white/80 p-4 shadow-[0_24px_60px_rgba(37,99,235,0.12)] backdrop-blur-xl transition-transform
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Close (mobile) */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <p className="font-semibold">Menu</p>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 border-b border-white/70 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-lg font-bold text-white">
            {profile.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{profile.name}</p>
            <p className="text-xs text-slate-500">{profile.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-4 flex flex-col gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                activeTab === key
                  ? "border-blue-500 bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_16px_30px_rgba(37,99,235,0.22)]"
                  : "border-slate-200 bg-white text-slate-700 hover:-translate-y-1 hover:border-blue-200 hover:text-blue-700 hover:shadow-[0_18px_36px_rgba(37,99,235,0.12)]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-semibold">{label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="ucef-danger-btn mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3"
        >
          <LogOut size={18} /> Logout
        </button>

        <button
          onClick={onDeleteAccount}
          disabled={deletingAccount}
          className={`mt-3 flex w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold ${
            deletingAccount
              ? "cursor-not-allowed border-red-200 bg-red-100 text-red-400"
              : "border-red-300 bg-white text-red-600 hover:bg-red-50"
          }`}
        >
          {deletingAccount ? "Deleting Account..." : "Delete Account Permanently"}
        </button>
      </aside>
    </>
  );
}
function RowMini({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}


export default StudentDashboard;
