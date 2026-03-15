/**
 * Event Detail Modal Component
 * Displays comprehensive event details in a modal popup
 * Features: Smooth animations, close on X/background/Escape, responsive design
 */

import React, { useEffect } from "react";
import { X, Calendar, Clock, MapPin, Users, DollarSign, Tag } from "lucide-react";
import Badge from "./Badge";

export default function EventDetailModal({ event, isOpen, onClose, onRegister }) {

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

  // Parse event dates and times
  const startDate = event.start_time
    ? new Date(event.start_time)
    : new Date(`${event.date} ${event.time || "00:00"}`);

  const endDate = event.end_time ? new Date(event.end_time) : startDate;

  const dateStr = startDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = `${startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const venue = event.venue || event.location || "Campus Venue";
  const capacity = event.capacity ?? 200;
  const registered = event.registered_count ?? event.registered ?? 0;
  const occupancyPercent = Math.round((registered / capacity) * 100);
  const spotsRemaining = capacity - registered;

  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const normalizeImage = (raw) => {
    if (!raw) return "/event-placeholder.jpg";
    if (raw.startsWith("http")) return raw;
    if (raw.startsWith("/uploads")) return `${BACKEND}${raw}`;
    return `${BACKEND}/${raw}`;
  };

  const imageUrl = normalizeImage(event.image_url || event.imageUrl);

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
          className="bg-white rounded-[20px] shadow-luxury-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideInRight"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Section */}
          <div className="relative h-64 md:h-80 overflow-hidden rounded-t-[20px]">
            {/* Event Image */}
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/event-placeholder.jpg")}
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-primary-dark/80 hover:bg-primary-dark text-white p-2 rounded-full transition-all duration-luxury hover:scale-110 z-10"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white tracking-luxury mb-2">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {event.category && (
                  <Badge variant="gold" size="sm">
                    {event.category}
                  </Badge>
                )}
                {event.tags?.map((tag) => (
                  <Badge key={tag} variant="light" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Event Description */}
            <div>
              <h2 className="text-xl font-playfair font-semibold text-text mb-3 tracking-luxury">
                About this Event
              </h2>
              <p className="text-text-muted font-dm font-light leading-relaxed text-justify">
                {event.description}
              </p>
            </div>

            {/* Divider */}
            <div className="divider-luxury" />

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-accent-gold/10">
                    <Calendar className="h-6 w-6 text-accent-gold" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-dm font-semibold text-text">Date & Time</p>
                  <p className="text-text-muted font-dm font-light text-sm mt-1">
                    {dateStr}
                  </p>
                  <p className="text-text-muted font-dm font-light text-sm">
                    {timeStr}
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-accent-gold/10">
                    <MapPin className="h-6 w-6 text-accent-gold" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-dm font-semibold text-text">Venue</p>
                  <p className="text-text-muted font-dm font-light text-sm mt-1">
                    {venue}
                  </p>
                </div>
              </div>

              {/* Capacity */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-accent-gold/10">
                    <Users className="h-6 w-6 text-accent-gold" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-dm font-semibold text-text">Capacity</p>
                  <p className="text-text-muted font-dm font-light text-sm mt-1">
                    {registered} / {capacity} registered
                  </p>
                  <p className="text-xs text-accent-gold font-dm font-medium mt-1">
                    {spotsRemaining > 0
                      ? `${spotsRemaining} spots remaining`
                      : "Event Full"}
                  </p>
                </div>
              </div>

              {/* Organizer */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-accent-gold/10">
                    <Tag className="h-6 w-6 text-accent-gold" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-dm font-semibold text-text">Organizer</p>
                  <p className="text-text-muted font-dm font-light text-sm mt-1">
                    {event.organizer || event.club_name || "UCEF"}
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="bg-background-cream p-4 rounded-luxury">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-dm font-semibold text-text">
                  Registration Progress
                </p>
                <p className="text-sm font-dm font-semibold text-accent-gold">
                  {occupancyPercent}%
                </p>
              </div>
              <div className="w-full bg-border-light rounded-full h-3">
                <div
                  className="bg-gradient-gold h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Additional Info */}
            {event.requirements && (
              <div>
                <h3 className="text-lg font-playfair font-semibold text-text mb-3 tracking-luxury">
                  Requirements
                </h3>
                <p className="text-text-muted font-dm font-light leading-relaxed">
                  {event.requirements}
                </p>
              </div>
            )}

            {event.benefits && (
              <div>
                <h3 className="text-lg font-playfair font-semibold text-text mb-3 tracking-luxury">
                  Benefits
                </h3>
                <p className="text-text-muted font-dm font-light leading-relaxed">
                  {event.benefits}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="divider-luxury" />

            {/* Share & Quick Access Section */}
            <div className="bg-background-cream rounded-luxury p-6 border border-border-light">
              <h3 className="text-lg font-playfair font-semibold text-text mb-4 tracking-luxury">
                Share Event
              </h3>
              <div className="space-y-3">
                {/* Event Code */}
                <div>
                  <p className="text-sm font-dm font-light text-text-muted mb-2">Event Code (Share with others)</p>
                  <div className="bg-white rounded-luxury px-4 py-2 border border-border-light flex items-center justify-between">
                    <code className="font-dm font-medium text-accent-gold text-sm">EVT-{event.id}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`EVT-${event.id}`);
                      }}
                      className="text-xs text-text-muted hover:text-accent-gold transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Share Options */}
                <div className="pt-2">
                  <p className="text-sm font-dm font-light text-text-muted mb-3">Share via:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const text = `Check out "${event.title}" - Register here!`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                      }}
                      className="text-xs px-3 py-2 rounded-luxury bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors font-dm font-medium"
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        const text = `Check out "${event.title}"`;
                        window.open(
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                          "_blank"
                        );
                      }}
                      className="text-xs px-3 py-2 rounded-luxury bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors font-dm font-medium"
                    >
                      Twitter
                    </button>
                    <button
                      onClick={() => {
                        const text = event.description || "";
                        const subject = `Event: ${event.title}`;
                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
                      }}
                      className="text-xs px-3 py-2 rounded-luxury bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors font-dm font-medium"
                    >
                      Email
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="divider-luxury" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-luxury border border-border-light text-text-muted font-dm font-medium hover:bg-background-cream transition-all duration-luxury"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (onRegister) {
                    onRegister();
                  }
                }}
                className="flex-1 px-6 py-3 rounded-luxury bg-accent-gold text-primary-dark font-dm font-medium hover:bg-accent-gold-light transition-all duration-luxury hover:shadow-luxury-md"
              >
                Register Now
              </button>
            </div>

            {/* Footer Info */}
            <p className="text-xs text-text-muted text-center font-dm font-light">
              Press <kbd className="font-semibold">ESC</kbd> to close this modal
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
