import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { adminLogin, adminLogout, adminRegister } from "../../services/authAdmin";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setSearchParams(nextMode === "register" ? { mode: "register" } : {});
    setError("");
    setSuccess("");
  };

  const handleHome = () => {
    adminLogout();
    localStorage.removeItem("organizerToken");
    localStorage.removeItem("organizerMember");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("studentRollNo");
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "register") {
        await adminRegister(form.name, form.email, form.password);
        toast.success("You are registered successfully.", {
          description: "Your admin account has been created.",
        });
        setSuccess("Admin account created successfully. You can log in now.");
        setForm((prev) => ({ ...prev, password: "" }));
        setMode("login");
        setSearchParams({});
      } else {
        await adminLogin(form.email, form.password);
        toast.success("Login successful.", {
          description: "Welcome back to the admin dashboard.",
        });
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.message || `${mode === "register" ? "Registration" : "Login"} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ucef-auth-shell px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl overflow-hidden rounded-[36px] border border-white/80 bg-white/90 shadow-[0_30px_90px_rgba(37,99,235,0.16)] backdrop-blur">
        <div className="hidden w-[44%] bg-[linear-gradient(135deg,rgba(37,99,235,0.96),rgba(14,165,233,0.9),rgba(125,211,252,0.82))] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">UCEF</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Admin access for club governance and campus operations.
            </h1>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">Security</p>
            <p className="mt-2 text-lg font-semibold">
              Protected admin routes and authenticated backend requests are now enforced.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
                    Admin Portal
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                    {mode === "login" ? "Login to continue" : "Create admin account"}
                  </h2>
                  <p className="mt-3 text-slate-500">
                    {mode === "login"
                      ? "Use your admin credentials to access the protected dashboard."
                      : "If no admin account exists yet, register one here first."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleHome}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                >
                  Home
                </button>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-blue-50/90 p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-blue-700"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-blue-700"
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <Field
                  label="Admin Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter admin name"
                  required
                />
              )}

              <Field
                label="Admin Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter admin email"
                required
              />

              <Field
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="ucef-primary-btn w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? mode === "login"
                    ? "Logging in..."
                    : "Creating account..."
                  : mode === "login"
                  ? "Admin Login"
                  : "Create Admin Account"}
              </button>
            </form>

            {mode === "register" && (
              <p className="mt-4 text-sm text-slate-500">
                Admin registration only accepts emails in the format
                {" "}
                <span className="font-semibold text-slate-700">name.surname@institute_name.org</span>.
              </p>
            )}
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
      />
    </label>
  );
}
