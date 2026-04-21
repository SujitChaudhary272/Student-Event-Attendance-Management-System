/**
 * Registration Modal Component
 * Inline registration form for event enrollment
 * Features: Form validation, submission handling, close mechanisms
 */

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function RegistrationModal({ event, isOpen, onClose, clubId }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rollNumber: "",
    branch: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // success, error, null

  // Close modal on Escape key
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
      if (!token) {
        setStatus({ type: "error", message: "Please login first" });
        setLoading(false);
        return;
      }

      // Determine the correct endpoint
      let endpoint;
      if (clubId) {
        // Club-specific event registration endpoint
        endpoint = `${BACKEND}/api/students/clubs/${clubId}/events/${event.id}/register`;
      } else {
        // Generic event registration endpoint
        endpoint = `${BACKEND}/api/student/events/${event.id}/register`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message: "Registration successful! See you at the event.",
        });
        setTimeout(() => {
          onClose();
          setFormData({ name: "", email: "", phone: "", rollNumber: "", branch: "" });
          setStatus(null);
        }, 2000);
      } else {
        setStatus({
          type: "error",
          message: data.message || "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setStatus({
        type: "error",
        message: "Network error. Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop with fade-in animation */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container with slide-up animation */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
        <div
          className="bg-white rounded-[20px] shadow-luxury-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideInRight"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-accent-gold to-accent-gold-light p-6 flex items-center justify-between rounded-t-[20px]">
            <h1 className="text-2xl font-playfair font-bold text-white tracking-luxury">
              Register Now
            </h1>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Event Info */}
            <div className="bg-background-cream rounded-luxury p-4 border border-border-light">
              <p className="text-sm font-dm font-light text-text-muted mb-1">Event</p>
              <h2 className="text-lg font-playfair font-semibold text-text">
                {event.title}
              </h2>
              <p className="text-xs text-text-muted font-dm mt-2">
                {event.club_name || "UCEF"}
              </p>
            </div>

            {/* Success Message */}
            {status?.type === "success" && (
              <div className="bg-green-50 border border-green-200 rounded-luxury p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-dm font-medium text-green-800">{status.message}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {status?.type === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-luxury p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-dm font-medium text-red-800">{status.message}</p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-dm font-semibold text-text mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-2 rounded-luxury border border-border-light bg-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30 outline-none transition-all font-dm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-dm font-semibold text-text mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-2 rounded-luxury border border-border-light bg-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30 outline-none transition-all font-dm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-dm font-semibold text-text mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                  required
                  className="w-full px-4 py-2 rounded-luxury border border-border-light bg-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30 outline-none transition-all font-dm"
                />
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-sm font-dm font-semibold text-text mb-2">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 21CO001"
                  className="w-full px-4 py-2 rounded-luxury border border-border-light bg-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30 outline-none transition-all font-dm"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-dm font-semibold text-text mb-2">
                  Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-luxury border border-border-light bg-white focus:border-accent-gold focus:ring-1 focus:ring-accent-gold/30 outline-none transition-all font-dm"
                >
                  <option value="">Select your branch</option>
                  <option value="IT">Information Technology</option>
                  <option value="CS">Computer Science</option>
                  <option value="EC">Electronics & Communication</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="CE">Civil Engineering</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-luxury bg-accent-gold text-primary-dark font-dm font-semibold hover:bg-accent-gold-light transition-all duration-luxury hover:shadow-luxury-md disabled:bg-border-light disabled:text-text-muted disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Complete Registration"}
              </button>
            </form>

            {/* Terms */}
            <p className="text-xs text-text-muted text-center font-dm font-light">
              By registering, you agree to receive updates about this event
            </p>

            {/* Divider */}
            <div className="divider-luxury" />

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-luxury border border-border-light text-text-muted font-dm font-medium hover:bg-background-cream transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
