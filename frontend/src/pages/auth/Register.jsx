import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { studentSignup } from "../../services/authStudent";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", rollNo: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
    const normalizedEmail = form.email.trim().toLowerCase();
    try {
      setError("");
      await studentSignup(
        form.name.trim(),
        normalizedEmail,
        form.rollNo.trim(),
        form.password
      );
      toast.success("You are registered successfully.", {
        description: "Your student account is ready.",
      });
      navigate("/student/dashboard");
    } catch (err) {
      if (err.message?.includes("Please login")) {
        navigate("/student/login");
        return;
      }
      setError(err.message || "Signup failed");
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
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900">Student Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Institute Email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="off" required />
          <Input label="Roll No" name="rollNo" value={form.rollNo} onChange={handleChange} required />
          <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="ucef-primary-btn w-full">Register</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already registered?{" "}
          <button
            type="button"
            onClick={() => navigate("/student/login")}
            className="font-semibold text-blue-700 transition hover:text-cyan-600"
          >
            Login here
          </button>
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

export default Register;
