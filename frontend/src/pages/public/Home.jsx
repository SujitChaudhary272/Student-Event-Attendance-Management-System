import React, { useEffect, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { useLocation } from "react-router-dom";
import AnimatedBackground from "../../components/common/AnimatedBackground";
import Navbar from "../../components/common/Navbar";
import HeroSection from "../../components/common/HeroSection";
import ClubSection from "../../components/common/ClubSection";
import Footer from "../../components/common/Footer";

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const targetSection = location.state?.scrollTo;
    if (!targetSection) return;

    const timer = window.setTimeout(() => {
      scrollToSection(targetSection);
      window.history.replaceState({}, document.title);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.state]);

  return (
    <div className="ucef-page-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <AnimatedBackground />
      </div>

      <Navbar onNavigateSection={scrollToSection} />

      <HeroSection
        search={search}
        setSearch={setSearch}
        onExploreClubs={() => scrollToSection("clubs")}
      />

      <main className="relative z-10 -mt-2 space-y-14 pb-14 md:-mt-4 md:space-y-16">
        <section id="clubs">
          <ClubSection search={search} filter={filter} setFilter={setFilter} />
        </section>

        <section id="contact" className="mx-auto max-w-5xl px-5 md:px-8">
          <div className="ucef-hero">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-50/80">
              Contact
            </p>
            <h2 className="mt-2 text-3xl font-bold">Reach out for campus event updates</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <p className="text-sm text-blue-50/80">Current location</p>
                    <p className="font-semibold text-white">My current location</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <div>
                    <p className="text-sm text-blue-50/80">Mobile</p>
                    <p className="font-semibold text-white">8127390567</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
