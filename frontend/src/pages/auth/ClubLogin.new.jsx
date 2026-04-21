// Updated ClubLogin with luxury design
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { organizerLogin } from "../../services/apiOrganizer";
import Button from "../../components/common/Button";

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
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-cream relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 bg-accent-gold blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-8 bg-accent-gold-light blur-3xl pointer-events-none"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="card-luxury space-y-8">
          {/* Header */}
          <div>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={handleHome}
                className="rounded-xl border border-border-light px-4 py-2 text-sm font-semibold text-text-muted transition-all duration-luxury hover:border-accent-gold hover:text-accent-gold"
              >
                Home
              </button>
            </div>
            <div className="text-center">
            <h1 className="text-4xl font-playfair font-700 text-text tracking-luxury mb-2">
              Organizer Hub
            </h1>
            <p className="text-text-muted font-dm font-300 text-lg">
              Access your club's event console
            </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-luxury p-4">
              <p className="text-red-700 font-dm font-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <FormInput
              label="Club Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="club.email@institute.edu"
              required
            />

            <FormInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login to Console"}
            </Button>
          </form>

          {/* Divider */}
          <div className="divider-luxury"></div>

          {/* Footer Links */}
          <div className="flex justify-center gap-4 text-sm">
            <a
              href="#"
              className="text-text-muted hover:text-accent-gold transition-colors duration-luxury"
            >
              Forgot password?
            </a>
            <span className="text-border-light">•</span>
            <a
              href="#"
              className="text-text-muted hover:text-accent-gold transition-colors duration-luxury"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const FormInput = ({ label, ...props }) => (
  <div>
    <label className="block text-text font-dm font-500 text-sm mb-2 tracking-wide">
      {label}
    </label>
    <input
      {...props}
      className="w-full border border-border-light rounded-luxury px-4 py-3 bg-white font-dm font-300 text-text placeholder-text-muted/50 transition-all duration-luxury focus:outline-none focus:ring-2 focus:ring-accent-gold/30 focus:border-accent-gold"
    />
  </div>
);
