import React, { useEffect, useState } from "react";
import ClubCard from "./ClubCard";
import { getAllClubs } from "../../services/apiClub";

export default function ClubsSection({ search, filter, setFilter }) {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Academic", "Sports", "Arts", "Technology"];

  // ✅ Fetch clubs from backend
  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const data = await getAllClubs();
      setClubs(data);
    } catch (err) {
      console.error("Failed to load clubs:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filtering
  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = club.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      filter === "All" || club.category === filter;

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="relative z-10 py-20 px-6 md:px-10">
      <h2 className="text-center text-4xl font-bold text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.4)]">
        Explore Registered College Clubs
      </h2>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-5 py-2 rounded-full font-semibold ${
              filter === cat
                ? "bg-[linear-gradient(135deg,#2563eb,#38bdf8)] text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)]"
                : "border border-white/20 bg-white/10 text-white backdrop-blur-xl hover:-translate-y-1 hover:bg-white/20 hover:text-cyan-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <p className="mt-10 text-center text-blue-50/80">
          Loading clubs from database...
        </p>
      )}

      {/* Clubs Grid */}
      <div className="grid md:grid-cols-4 gap-8 mt-12">
        {filteredClubs.map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>

      {/* No clubs */}
      {!loading && filteredClubs.length === 0 && (
        <p className="mt-10 text-center text-blue-50/80">
          No clubs found.
        </p>
      )}
    </section>
  );
}
