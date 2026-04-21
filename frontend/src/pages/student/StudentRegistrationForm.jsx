// ClubStudentRegistrationForm.jsx
import React, { useState} from "react";
import { useNavigate} from "react-router-dom";
import { toast } from "sonner";

const StudentRegistrationForm = ({ clubId, eventId }) => {
  const navigate = useNavigate();
  


  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNo: "",
    department: "",
    phone: "",
    gender: "",
    year: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/student/login");
    return;
  }

  // Optional: loading toast
  const tId = toast.loading("Registering you...", { duration: Infinity });

  try {
    const res = await fetch(
      `http://localhost:5000/api/students/clubs/${clubId}/events/${eventId}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          rollNo: form.rollNo,
          department: form.department,
          phone: form.phone,
          gender: form.gender,
          year: form.year,
        }),
      }
    );

    const data = await res.json();

    toast.dismiss(tId);

    // ✅ Already Registered (backend gives 409)
    if (res.status === 409) {
      toast.info("Already Registered ✅", {
        description: "You have already joined this event.",
        duration: 3500, // ✅ auto-dismiss + progress
      });
      return;
    }

    if (!res.ok) {
      toast.error(data.error || "Registration failed", {
        duration: 4000,
      });
      return;
    }

    toast.success("Registered successfully! 🎉", {
      description: "Redirecting to your dashboard...",
      duration: 3000,
    });

    navigate("/student/dashboard");
  } catch (err) {
    toast.dismiss(tId);
    toast.error("Network error. Please try again.", { duration: 4000 });
  }
};


 return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Top Bar (same style as ClubEventsPage) ===== */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ucef-back-btn"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>

          <p className="text-sm text-gray-500 font-medium">Event Registration</p>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="max-w-xl mx-auto">
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Student Registration
            </h1>
            <p className="text-gray-600 mt-2">
              Required for first-time participation in this club.
            </p>
          </div>

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Roll Number"
                name="rollNo"
                value={form.rollNo}
                onChange={handleChange}
                required
              />

              <Input
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />

              <Select
                label="Department"
                name="department"
                value={form.department}
                options={[
                  "Computer Engineering",
                  "Electronics & Telecommunication Engineering",
                  "Mechanical Engineering",
                  "Civil Engineering",
                  "Information Technology",
                  "Chemical Engineering",
                  "Biotechnology",
                  "Aerospace Engineering",
                  "AI & DS Engineering",
                ]}
                onChange={handleChange}
                required
              />

              <Select
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={["Male", "Female", "Other"]}
                required
              />

              <Select
                label="Year"
                name="year"
                value={form.year}
                onChange={handleChange}
                options={["1st Year", "2nd Year", "3rd Year", "4th Year"]}
                required
              />
            </div>

            {/* Buttons */}
            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="md:w-1/3 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="md:flex-1 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                Complete Registration & Join Event
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Your details will be saved for future event registrations.
            </p>
          </form>
        </div>
      </div>

      {/* Optional footer (same vibe as club page) */}
      <footer className="bg-gray-900 text-white py-8 mt-14 text-center">
        <p className="text-gray-400">© 2026 Unified Campus Events.</p>
      </footer>
    </div>
  );
};

// Input Component (club-page style)
const Input = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-800">{label}</label>
    <input
      {...props}
      className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900
      placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

// Select Component (club-page style)
const Select = ({ label, options, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-800">{label}</label>
    <select
      {...props}
      className="w-full mt-1 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    >
      <option value="">Select {label}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default StudentRegistrationForm;
