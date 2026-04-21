import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function FirstTimeJoinFlow() {
  const { clubId, eventId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState("signup"); // signup | details
  const [loading, setLoading] = useState(false);

  const [signup, setSignup] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [details, setDetails] = useState({
    name: "",
    email: "",
    rollNo: "",
    department: "",
    phone: "",
    gender: "",
    year: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedName = localStorage.getItem("studentName");
    const savedEmail = localStorage.getItem("studentEmail");

    if (token && savedName && savedEmail) {
      setDetails((prev) => ({ ...prev, name: savedName, email: savedEmail }));
      setStep("details");
    }
  }, []);

  const onChangeSignup = (e) =>
    setSignup({ ...signup, [e.target.name]: e.target.value });

  const onChangeDetails = (e) =>
    setDetails({ ...details, [e.target.name]: e.target.value });

  const submitSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/students/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return;
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "Student");
      }
      localStorage.setItem("studentName", data?.name || signup.name);
      localStorage.setItem("studentEmail", data?.email || signup.email);

      setDetails((prev) => ({
        ...prev,
        name: data?.name || signup.name,
        email: data?.email || signup.email,
      }));
      setStep("details");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      return;
    }
  };

  const submitDetails = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/student/login");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/api/students/clubs/${clubId}/events/${eventId}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(details),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return;
      }

      setLoading(false);
      navigate(`/club/${clubId}`);
    } catch (err) {
      setLoading(false);
      return;
    }
  };

  return (
    <div className="ucef-auth-shell flex items-center justify-center px-5">
      <div className="ucef-card-strong w-full max-w-lg p-8 text-slate-900">
        {step === "signup" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Create Account</h1>
            <p className="mb-6 text-slate-500">
              First time? Create your account to join this event.
            </p>

            <form onSubmit={submitSignup}>
              <Field label="Name">
                <input
                  name="name"
                  value={signup.name}
                  onChange={onChangeSignup}
                  className="inputDark"
                  required
                />
              </Field>

              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  value={signup.email}
                  onChange={onChangeSignup}
                  className="inputDark"
                  required
                />
              </Field>

              <Field label="Password">
                <input
                  name="password"
                  type="password"
                  value={signup.password}
                  onChange={onChangeSignup}
                  className="inputDark"
                  required
                />
              </Field>

              <button
                disabled={loading}
                className="ucef-primary-btn mt-4 w-full"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </>
        )}

        {step === "details" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Event Registration</h1>
            <form onSubmit={submitDetails}>
              <Field label="Name">
                <input
                  name="name"
                  value={details.name}
                  className="inputDark"
                  readOnly
                />
              </Field>

              <Field label="Email">
                <input
                  name="email"
                  value={details.email}
                  className="inputDark"
                  readOnly
                />
              </Field>

              <Field label="Roll No">
                <input
                  name="rollNo"
                  value={details.rollNo}
                  onChange={onChangeDetails}
                  className="inputDark"
                  required
                />
              </Field>

              <Field label="Department">
                <select
                  name="department"
                  value={details.department}
                  onChange={onChangeDetails}
                  className="inputDark"
                  required
                >
                  <option value="">Select Department</option>
                  {[
                    "Computer Engineering",
                    "Electronics & Telecommunication Engineering",
                    "Mechanical Engineering",
                    "Civil Engineering",
                    "Information Technology",
                    "AI & DS Engineering",
                  ].map((d) => (
                    <option key={d} value={d} className="text-black">
                      {d}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Phone">
                <input
                  name="phone"
                  value={details.phone}
                  onChange={onChangeDetails}
                  className="inputDark"
                  required
                />
              </Field>

              <Field label="Gender">
                <select
                  name="gender"
                  value={details.gender}
                  onChange={onChangeDetails}
                  className="inputDark"
                  required
                >
                  <option value="">Select Gender</option>
                  {["Male", "Female", "Other"].map((g) => (
                    <option key={g} value={g} className="text-black">
                      {g}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Year">
                <select
                  name="year"
                  value={details.year}
                  onChange={onChangeDetails}
                  className="inputDark"
                  required
                >
                  <option value="">Select Year</option>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => (
                    <option key={y} value={y} className="text-black">
                      {y}
                    </option>
                  ))}
                </select>
              </Field>

              <button
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-[linear-gradient(135deg,#0ea5e9,#38bdf8)] py-3 font-semibold text-white shadow-[0_16px_34px_rgba(14,165,233,0.2)] transition duration-300 hover:-translate-y-1"
              >
                {loading ? "Registering..." : "Submit & Join Event"}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        .inputDark{
          width: 100%;
          padding: 12px 14px;
          margin-top: 6px;
          border-radius: 12px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(203,213,225,0.8);
          color: #0f172a;
          outline: none;
        }
        .inputDark:focus{
          border: 1px solid rgba(59,130,246,0.9);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.25);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
