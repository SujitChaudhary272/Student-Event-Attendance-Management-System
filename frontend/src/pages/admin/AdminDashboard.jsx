import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  Bars3Icon,
  BuildingOffice2Icon,
  SparklesIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchDashboardStats } from "../../services/apiAdmin.js";
import { adminLogout } from "../../services/authAdmin.js";

const menuItems = [
  {
    name: "Dashboard",
    icon: HomeIcon,
    path: "/admin/dashboard",
  },
  {
    name: "Manage Clubs",
    icon: UsersIcon,
    children: [{ name: "Add Clubs", path: "/admin/clubs" }],
  },
  {
    name: "Student Reports",
    icon: UsersIcon,
    path: "/admin/reports",
  },
];

const fallbackStats = {
  totalClubs: 0,
  totalEvents: 0,
  activeEvents: 0,
  monthlyEvents: [],
};

const statCards = [
  {
    key: "totalClubs",
    label: "Total Clubs",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    icon: BuildingOffice2Icon,
    note: "Active governance units",
  },
  {
    key: "totalEvents",
    label: "Total Events",
    accent: "from-cyan-500 via-sky-500 to-indigo-500",
    icon: SparklesIcon,
    note: "Events created in the system",
  },
  {
    key: "activeEvents",
    label: "Active Events",
    accent: "from-emerald-500 via-green-500 to-lime-500",
    icon: BoltIcon,
    note: "Currently live experiences",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [stats, setStats] = useState(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const adminName = localStorage.getItem("adminName") || "Admin";

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats();
        setStats({
          totalClubs: data?.totalClubs ?? 0,
          totalEvents: data?.totalEvents ?? 0,
          activeEvents: data?.activeEvents ?? 0,
          monthlyEvents: Array.isArray(data?.monthlyEvents) ? data.monthlyEvents : [],
        });
        setError("");
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const toggleSubmenu = (name) =>
    setOpenSubmenu(openSubmenu === name ? null : name);

  const profileActions = [
    { label: "Admin Login", path: "/admin/login" },
  ];

  const handleProfileNavigate = (path) => {
    setOpenProfileMenu(false);
    navigate(path);
  };

  const handleLogout = () => {
    adminLogout();
    setOpenProfileMenu(false);
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eff6ff_52%,_#dbeafe_100%)] text-slate-900">
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-20"
        } border-r border-white/70 bg-white/75 text-slate-900 backdrop-blur-xl transition-all duration-300 shadow-[0_24px_60px_rgba(37,99,235,0.12)]`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
          <div className={`${!sidebarOpen && "hidden"}`}>
            <h1 className="text-lg font-semibold">Admin Console</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-2xl border border-slate-200 bg-white/90 p-2 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Bars3Icon className="h-6 w-6 text-slate-700" />
          </button>
        </div>

        <nav className="mt-4 px-3">
          {menuItems.map((item) => (
            <div key={item.name} className="mb-2">
              <button
                onClick={() =>
                  item.children ? toggleSubmenu(item.name) : navigate(item.path)
                }
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-700 transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-blue-700 hover:shadow-[0_18px_36px_rgba(37,99,235,0.12)]"
              >
                <item.icon className="h-6 w-6 shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </button>

              {item.children && openSubmenu === item.name && sidebarOpen && (
                <div className="mt-2 ml-6 space-y-2">
                  {item.children.map((child) => (
                    <button
                      key={child.name}
                      onClick={() => navigate(child.path)}
                      className="block w-full rounded-xl px-4 py-2 text-left text-sm text-slate-500 transition hover:bg-white hover:text-blue-700"
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <div className="border-b border-slate-200/70 bg-white/70 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                Student Event Attendance Management system
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Admin Dashboard
              </h2>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenProfileMenu((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-sm font-semibold text-white">
                  A
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-500">Signed in as</p>
                  <p className="font-semibold text-slate-900">{adminName}</p>
                </div>
              </button>

              {openProfileMenu && (
                <div className="absolute right-0 z-20 mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Quick Access</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Open the connected login and registration pages directly from this menu.
                    </p>
                  </div>

                  <div className="p-2">
                    {profileActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => handleProfileNavigate(action.path)}
                        className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        {action.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <section className="ucef-hero mb-8">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                  Operations Pulse
                </p>
                <h3 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight">
                  Live campus activity, club operations, and event momentum in one view.
                </h3>
                <p className="mt-4 max-w-2xl text-slate-300">
                  The dashboard now reads directly from your backend so the cards and trend chart reflect real project data instead of placeholder values.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 transition duration-300 hover:-translate-y-1">
                  <p className="text-sm text-blue-50/80">Clubs Connected</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.totalClubs}</p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 transition duration-300 hover:-translate-y-1">
                  <p className="text-sm text-blue-50/80">Events Registered</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.totalEvents}</p>
                </div>
                <div className="rounded-3xl border border-white/20 bg-white/10 p-5 transition duration-300 hover:-translate-y-1">
                  <p className="text-sm text-blue-50/80">Events Live</p>
                  <p className="mt-2 text-3xl font-semibold">{stats.activeEvents}</p>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          <section className="mb-8 grid gap-6 lg:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              const value = stats[card.key];

              return (
                <article
                  key={card.key}
                  className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)] backdrop-blur"
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{card.label}</p>
                      <p className="mt-4 text-5xl font-semibold tracking-tight text-slate-900">
                        {loading ? "..." : value}
                      </p>
                      <p className="mt-3 text-sm text-slate-500">{card.note}</p>
                    </div>
                    <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-3 text-white shadow-lg`}>
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)] backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
                    Trendline
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                    Monthly Events Overview
                  </h3>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  Backend synced
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyEvents}>
                    <defs>
                      <linearGradient id="eventsGlow" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="events"
                      stroke="#0f172a"
                      fill="url(#eventsGlow)"
                      strokeWidth={0}
                    />
                    <Line
                      type="monotone"
                      dataKey="events"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_rgba(148,163,184,0.18)] backdrop-blur">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
                Snapshot
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Governance Summary
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Coverage</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {stats.totalClubs} clubs supervising {stats.totalEvents} events
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Current Pulse</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {stats.activeEvents} live event{stats.activeEvents === 1 ? "" : "s"} happening now
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Data Source</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    Directly loaded from backend admin statistics
                  </p>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
