import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UpcomingEvents from "../../components/common/UpcomingEvents";
import LiveEvents from "../../components/common/LiveEvents";
import { ArrowLeft, Share2, Heart, Bell } from "lucide-react";
import { toast } from "sonner";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function ClubEventsPage() {
  const { clubId } = useParams();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const clubRes = await fetch(`${BACKEND}/api/public/clubs/${clubId}`);
        const clubData = await clubRes.json();
        if (!clubRes.ok) throw new Error("Club not found");
        setClub(clubData);

        const evRes = await fetch(`${BACKEND}/api/public/clubs/${clubId}/events`);
        const evData = await evRes.json();
        setClubEvents(Array.isArray(evData) ? evData : []);
      } catch (err) {
        console.error(err);
        setClub(null);
        setClubEvents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [clubId]);

  const handleFollow = () => {
    setIsFollowing((prev) => !prev);
    toast.success(!isFollowing ? "Following club! Notifications enabled." : "Unfollowed club");
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="ucef-page-shell flex items-center justify-center">
        <p className="text-slate-500">Loading club...</p>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="ucef-page-shell flex items-center justify-center">
        <p className="text-slate-500">Club not found</p>
      </div>
    );
  }

  const bannerSrc = club.image?.startsWith("http")
    ? club.image
    : `${BACKEND}${club.image}`;

  return (
    <div className="ucef-page-shell">
      <div className="ucef-topbar sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>
      </div>

      <div className="relative h-72 overflow-hidden md:h-80">
        <img src={bannerSrc} alt={club.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.55))]" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-white">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] backdrop-blur">
            Club Spotlight
          </div>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">{club.name}</h1>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl space-y-12 px-6">
        <div className="flex justify-end gap-3">
          <button
            onClick={handleFollow}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 transition duration-300 hover:-translate-y-1 ${
              isFollowing
                ? "border border-white/80 bg-white/90 text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.12)]"
                : "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_16px_34px_rgba(37,99,235,0.22)]"
            }`}
          >
            {isFollowing ? <Heart className="h-5 w-5 fill-current" /> : <Bell className="h-5 w-5" />}
            {isFollowing ? "Following" : "Follow"}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg border border-white/80 bg-white/90 px-5 py-2 shadow-[0_12px_28px_rgba(148,163,184,0.12)] transition duration-300 hover:-translate-y-1 hover:text-blue-700"
          >
            <Share2 className="h-5 w-5" />
            Share
          </button>
        </div>

        <LiveEvents events={clubEvents} />
        <UpcomingEvents events={clubEvents} />
      </div>

      <footer className="mt-14 border-t border-white/70 bg-white/60 py-8 text-center backdrop-blur">
        <p className="text-slate-500">Copyright 2026 Unified Campus Events. All rights reserved.</p>
      </footer>
    </div>
  );
}
