import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  Clock3,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  createMyClubEvent,
  deleteMyClubEvent,
  fetchMyClubEvents,
  fetchMyOrganizerProfile,
} from "../../services/apiOrganizer";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "create", label: "Create Event", icon: PlusCircle },
  { key: "events", label: "My Events", icon: Calendar },
];

const PIE_COLORS = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#8b5cf6"];

const initialForm = {
  title: "",
  description: "",
  event_type: "Workshop",
  start_time: "",
  end_time: "",
  venue: "",
  capacity: "",
  image_url: "",
};

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    try {
      setLoadingEvents(true);
      const [profileData, eventsData] = await Promise.all([
        fetchMyOrganizerProfile(),
        fetchMyClubEvents(),
      ]);

      setProfile(profileData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      console.error(err);
      localStorage.removeItem("organizerToken");
      localStorage.removeItem("organizerMember");
      navigate("/organizer/login");
    } finally {
      setLoadingEvents(false);
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("organizerToken");
    if (!token) {
      navigate("/organizer/login");
      return;
    }

    load();
  }, []);

  const logout = () => {
    localStorage.removeItem("organizerToken");
    localStorage.removeItem("organizerMember");
    navigate("/organizer/login");
  };

  const createEvent = async (e) => {
    e.preventDefault();

    if (new Date(form.end_time) <= new Date(form.start_time)) {
      alert("End time must be after start time");
      return;
    }

    const payload = {
      ...form,
      capacity: form.capacity ? Number(form.capacity) : null,
    };

    const res = await createMyClubEvent(payload);
    if (res?.error) {
      alert(res.error);
      return;
    }

    alert("Event created successfully");
    setForm(initialForm);
    setActiveTab("events");
    load();
  };

  const removeArchivedEvent = async (event) => {
    const ok = window.confirm(`Delete archived event "${event.title}"? This action cannot be undone.`);
    if (!ok) return;

    const res = await deleteMyClubEvent(event.id);
    if (res?.error) {
      alert(res.error);
      return;
    }

    alert("Event deleted successfully");
    load();
  };

  const stats = useMemo(() => {
    const total = events.length;
    const created = events.filter((e) => e.status === "Created").length;
    const live = events.filter((e) => e.status === "Live").length;
    const completed = events.filter((e) => e.status === "Completed").length;
    const archived = events.filter((e) => e.status === "Archived").length;
    const totalRegistered = events.reduce((sum, e) => sum + Number(e.registered_count ?? 0), 0);
    const totalPresent = events.reduce((sum, e) => sum + Number(e.present_total ?? 0), 0);

    return {
      total,
      created,
      live,
      completed,
      archived,
      totalRegistered,
      totalPresent,
    };
  }, [events]);

  const barData = useMemo(
    () =>
      events.slice(0, 6).map((event) => ({
        name: event.title?.slice(0, 12) || "Event",
        registered: Number(event.registered_count ?? 0),
        present: Number(event.present_total ?? 0),
      })),
    [events]
  );

  const pieData = useMemo(
    () =>
      [
        { name: "Created", value: stats.created },
        { name: "Live", value: stats.live },
        { name: "Completed", value: stats.completed },
        { name: "Archived", value: stats.archived },
      ].filter((item) => item.value > 0),
    [stats]
  );

  const badgeClass = (status) => {
    const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border";
    if (status === "Live") return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    if (status === "Created") return `${base} border-amber-200 bg-amber-50 text-amber-700`;
    if (status === "Completed") return `${base} border-sky-200 bg-sky-50 text-sky-700`;
    return `${base} border-slate-200 bg-slate-100 text-slate-600`;
  };

  if (loadingPage) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.2),_transparent_22%),linear-gradient(180deg,_#f7fbff_0%,_#edf5ff_54%,_#e0eeff_100%)]">
        <div className="rounded-[28px] border border-white/80 bg-white/80 px-8 py-5 text-slate-700 shadow-[0_22px_50px_rgba(37,99,235,0.12)] backdrop-blur">
          Loading organizer console...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.22),_transparent_26%),linear-gradient(180deg,_#f8fbff_0%,_#eff6ff_45%,_#dbeafe_100%)] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-10 left-12 h-60 w-60 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">UCEF</p>
            <h1 className="text-lg font-semibold text-slate-900">Organizer Console</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      </header>

      <div className="relative w-full px-4 py-6 md:px-6 xl:px-10 2xl:px-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            profile={profile}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setSidebarOpen(false);
            }}
            logout={logout}
          />

          <main className="space-y-6">
            <section className="overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,_rgba(37,99,235,0.94),_rgba(14,165,233,0.88)_55%,_rgba(125,211,252,0.78))] px-6 py-8 text-white shadow-[0_35px_90px_rgba(37,99,235,0.24)] transition duration-500 hover:shadow-[0_42px_110px_rgba(14,165,233,0.28)] md:px-8 md:py-9">
              <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/70">Organizer Dashboard</p>
                  <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
                    Manage your club events with faster actions and clear live updates.
                  </h2>
                  <p className="mt-4 max-w-2xl text-blue-50/90">
                    Track events, registrations, and attendance in one simple workspace.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                  <HeroMini title="Club" value={profile?.club_name || "Club"} />
                  <HeroMini title="Role" value={profile?.role || "Member"} />
                  <HeroMini title="Events Live" value={String(stats.live)} />
                </div>
              </div>
            </section>

            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <Panel
                    title="Registrations vs Attendance"
                    subtitle="Recent events performance"
                    icon={BarChart3}
                  >
                    {barData.length === 0 ? (
                      <EmptyNote text="No events yet." />
                    ) : (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#dbeafe" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="registered" fill="#2563eb" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="present" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <p className="mt-4 text-xs text-slate-500">
                      "Present" depends on QR scans or manual attendance.
                    </p>
                  </Panel>

                  <Panel
                    title="Event Status Distribution"
                    subtitle="Current portfolio mix"
                    icon={Calendar}
                  >
                    {pieData.length === 0 ? (
                      <EmptyNote text="No events yet." />
                    ) : (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={92} label>
                              {pieData.map((entry, index) => (
                                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Panel>
                </div>

                <Panel title="Recent Events" subtitle="Fast access to current activity" icon={RefreshCw}>
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={() => setActiveTab("events")}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-200 hover:text-blue-700 hover:shadow-[0_18px_36px_rgba(37,99,235,0.14)]"
                    >
                      View all
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {events.slice(0, 4).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => navigate(`/organizer/event/${event.id}`)}
                        className="rounded-[26px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(37,99,235,0.12)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{event.event_type}</p>
                          </div>
                          <span className={badgeClass(event.status)}>{event.status}</span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{event.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <SmallPill text={`Registered: ${Number(event.registered_count ?? 0)}`} tone="blue" />
                          <SmallPill text={`Present: ${Number(event.present_total ?? 0)}`} tone="emerald" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {events.length === 0 && <EmptyNote text="No events yet. Create your first event!" className="mt-2" />}
                </Panel>
              </div>
            )}

            {activeTab === "create" && (
              <Panel title="Create New Event" subtitle="Launch a polished event flow for your club" icon={PlusCircle}>
                <form onSubmit={createEvent} className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Event title"
                    required
                  />

                  <SelectField
                    label="Event Type"
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    options={["Workshop", "Hackathon", "Seminar", "Cultural"]}
                  />

                  <InputField
                    label="Start Time"
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    required
                  />

                  <InputField
                    label="End Time"
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    required
                  />

                  <InputField
                    label="Venue"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. Auditorium / Lab 301"
                    icon={MapPin}
                  />

                  <InputField
                    label="Capacity"
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    placeholder="e.g. 120"
                    icon={Users}
                  />

                  <InputField
                    label="Image URL"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                    icon={ImageIcon}
                  />

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                    <textarea
                      className="min-h-[140px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-300 placeholder:text-slate-400 focus:-translate-y-0.5 focus:border-blue-300 focus:shadow-[0_0_0_5px_rgba(191,219,254,0.45)]"
                      placeholder="Describe your event..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>

                  <button className="group md:col-span-2 inline-flex items-center justify-center gap-2 rounded-[24px] bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_28px_50px_rgba(14,165,233,0.32)] active:translate-y-0">
                    <PlusCircle className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                    Create Event
                  </button>
                </form>
              </Panel>
            )}

            {activeTab === "events" && (
              <Panel title="Club Events" subtitle="Manage and monitor every event in one place" icon={Calendar}>
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={load}
                    className="group inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(30,64,175,0.24)]"
                  >
                    <RefreshCw className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                    Refresh
                  </button>
                </div>

                {loadingEvents ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <EventSkeleton />
                    <EventSkeleton />
                    <EventSkeleton />
                    <EventSkeleton />
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        badgeClass={badgeClass}
                        onManage={() => navigate(`/organizer/event/${event.id}`)}
                        onDelete={() => removeArchivedEvent(event)}
                      />
                    ))}
                  </div>
                )}

                {!loadingEvents && events.length === 0 && <EmptyNote text="No events created yet." className="mt-2" />}
              </Panel>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose, profile, activeTab, setActiveTab, logout }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[300px] border-r border-white/70 bg-white/90 p-4 shadow-[0_24px_60px_rgba(37,99,235,0.16)] backdrop-blur-xl transition-transform duration-300 lg:static lg:h-auto lg:w-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Menu</p>
            <h2 className="text-lg font-semibold text-slate-900">Organizer Console</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white p-2 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#f7fbff_100%)] p-4 shadow-[0_16px_40px_rgba(148,163,184,0.12)]">
          <div className="rounded-[26px] bg-[linear-gradient(135deg,#2563eb,#38bdf8)] p-5 text-white shadow-[0_16px_34px_rgba(37,99,235,0.24)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(14,165,233,0.28)]">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur">
                {profile?.name?.charAt(0) || "O"}
              </div>
              <div>
                <p className="text-lg font-semibold">{profile?.name || "Organizer"}</p>
                <p className="text-sm text-blue-100">
                  {profile?.role || "Member"} • {profile?.club_name || "Club"}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-4 space-y-3">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex w-full items-center gap-3 rounded-[22px] border px-4 py-3.5 text-left font-semibold transition duration-300 ${
                  activeTab === key
                    ? "border-blue-500 bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_16px_30px_rgba(37,99,235,0.22)]"
                    : "border-slate-200 bg-white text-slate-800 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-200 hover:text-blue-700 hover:shadow-[0_18px_36px_rgba(37,99,235,0.14)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={logout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-4 py-3.5 font-semibold text-white shadow-[0_14px_28px_rgba(239,68,68,0.22)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(239,68,68,0.26)]"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function HeroMini({ title, value }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:bg-white/[0.16]">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatMini({ label, value, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "from-blue-500/15 to-cyan-500/10 text-blue-700",
    amber: "from-amber-500/15 to-orange-500/10 text-amber-700",
    emerald: "from-emerald-500/15 to-green-500/10 text-emerald-700",
    sky: "from-sky-500/15 to-blue-500/10 text-sky-700",
    slate: "from-slate-500/15 to-slate-400/10 text-slate-700",
  };

  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_16px_34px_rgba(148,163,184,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_24px_48px_rgba(37,99,235,0.14)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${tones[tone]} p-3`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, hint }) {
  return (
    <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_16px_34px_rgba(148,163,184,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_24px_50px_rgba(37,99,235,0.14)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-3 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_16px_34px_rgba(148,163,184,0.12)] backdrop-blur transition duration-300 hover:shadow-[0_24px_50px_rgba(37,99,235,0.08)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InputField({ label, icon: Icon, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-[24px] border border-slate-200 bg-white px-4 py-3 transition duration-300 focus-within:-translate-y-0.5 focus-within:border-blue-300 focus-within:shadow-[0_0_0_5px_rgba(191,219,254,0.45)]">
        {Icon ? <Icon className="h-4 w-4 text-slate-400" /> : null}
        <input
          {...props}
          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}

function SelectField({ label, options, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        {...props}
        className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition duration-300 focus:-translate-y-0.5 focus:border-blue-300 focus:shadow-[0_0_0_5px_rgba(191,219,254,0.45)]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function EventCard({ event, badgeClass, onManage, onDelete }) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const image = event.image_url && String(event.image_url).startsWith("http") ? event.image_url : null;
  const registered = Number(event.registered_count ?? 0);
  const present = Number(event.present_total ?? 0);

  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_32px_rgba(148,163,184,0.12)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-200 hover:shadow-[0_24px_50px_rgba(37,99,235,0.14)]">
      <div className="relative h-44 bg-[linear-gradient(135deg,#eff6ff,#dbeafe)]">
        {image ? (
          <img src={image} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-blue-300">
            <Calendar className="h-12 w-12" />
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{event.event_type}</p>
          </div>
          <span className={badgeClass(event.status)}>{event.status}</span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{event.description}</p>

        <div className="mt-4 space-y-2 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {start.toLocaleString()} → {end.toLocaleString()}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.venue || "PCCOE Campus"}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SmallPill text={`Registered: ${registered}`} tone="blue" />
          <SmallPill text={`Present: ${present}`} tone="emerald" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onManage}
            className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.18)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_20px_38px_rgba(37,99,235,0.24)]"
          >
            Manage Event
          </button>

          {event.status === "Archived" && (
            <button
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#dc2626,#ef4444)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(239,68,68,0.2)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_20px_38px_rgba(239,68,68,0.28)]"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm animate-pulse">
      <div className="h-44 bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
        <div className="h-10 w-32 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function SmallPill({ text, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{text}</span>;
}

function EmptyNote({ text, className = "" }) {
  return <p className={`text-sm text-slate-500 ${className}`}>{text}</p>;
}
