import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { studentLogin } from "../../services/authStudent";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleHome = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("studentName");
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("studentRollNo");
    localStorage.removeItem("organizerToken");
    localStorage.removeItem("organizerMember");
    localStorage.removeItem("adminName");
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const data = await studentLogin(form.email.trim().toLowerCase(), form.password);
      // authService stores token already; store role if provided
      if (data?.role) localStorage.setItem("role", data.role);
      toast.success("Login successful.", {
        description: "Welcome back to your student dashboard.",
      });
      navigate("/student/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="ucef-auth-shell flex items-center justify-center">
      <div className="ucef-card-strong ucef-card-hover w-full max-w-md p-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleHome}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            Home
          </button>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900">
          Student Login
        </h1>
        <p className="text-slate-500 text-center mb-6">
          Student Event Attendance Management system
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Institute Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="ucef-primary-btn w-full"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-slate-600">
          New student?{" "}
          <span
            onClick={() => navigate("/register")}
            className="cursor-pointer font-semibold text-blue-700 transition hover:text-cyan-600"
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    <input {...props} className="ucef-input mt-1" />
  </div>
);

export default Login;
