import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { organizerLogin } from "../../services/apiOrganizer";

export default function OrganizerLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleHome = () => {
    localStorage.removeItem("organizerToken");
    localStorage.removeItem("organizerMember");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("adminName");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("studentRollNo");
    navigate("/");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await organizerLogin(form);
      if (res.error) {
        setError(res.error);
        return;
      }

      localStorage.setItem("organizerToken", res.token);
      localStorage.setItem("organizerMember", JSON.stringify(res.member));
      navigate("/organizer/dashboard");
    } catch (err) {
      setError(err.message || "Organizer login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ucef-auth-shell overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-10 top-32 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[84vh] max-w-6xl overflow-hidden rounded-[36px] border border-white/80 bg-white/90 shadow-[0_35px_120px_rgba(37,99,235,0.18)] backdrop-blur-xl">
        <div className="hidden w-[48%] border-r border-white/20 bg-[linear-gradient(135deg,rgba(37,99,235,0.96),rgba(14,165,233,0.9),rgba(125,211,252,0.82))] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-blue-50">
              <SparklesIcon className="h-4 w-4" />
              Organizer Portal
            </div>

            <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight">
              Professional event control for club members.
            </h1>

          </div>

          <div className="space-y-4">
            <InfoCard
              icon={ShieldCheckIcon}
              title="Protected Access"
              text="Only authenticated organizer accounts can reach the organizer dashboard and make operational changes."
            />
            <InfoCard
              icon={CheckBadgeIcon}
              title="Admin-Issued Credentials"
              text="Your login email and password come directly from the admin when your club member account is created."
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 md:px-10">
          <div className="w-full max-w-xl">
            <div className="ucef-card-strong p-6 md:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
                      Club Console
                    </p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
                    Organizer Login
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleHome}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Home
                </button>

              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 shadow-[0_8px_30px_rgba(244,63,94,0.15)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <Field
                  label="Organizer Email"
                  type="email"
                  placeholder="Enter assigned email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Field
                  label="Password"
                  type="password"
                  placeholder="Enter assigned password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                <button
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_15px_35px_rgba(37,99,235,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(14,165,233,0.32)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  <span>{loading ? "Logging in..." : "Open Organizer Dashboard"}</span>
                  <ArrowRightIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        className="ucef-input"
        required
      />
    </label>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/12 p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.18]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-blue-50/90">{text}</p>
        </div>
      </div>
    </div>
  );
}
