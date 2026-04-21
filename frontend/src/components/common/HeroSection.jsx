export default function HeroSection({
  search,
  setSearch,
  onExploreClubs,
}) {
  return (
    <section
      id="home"
      className="relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-4 pb-12 pt-24 text-center text-white md:min-h-[82vh] md:pt-28"
    >
      {/* Foreground Content */}
      <div className="relative z-10 w-full px-4 md:px-6">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/15 bg-white/10 px-5 py-8 shadow-[0_24px_70px_rgba(37,99,235,0.18)] backdrop-blur-xl md:px-8 md:py-9">
          <h1 className="text-3xl font-extrabold leading-tight drop-shadow-lg sm:text-4xl md:text-5xl lg:text-6xl">
            Student Event Participation
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-base text-blue-50/90 md:text-lg">
            Explore and Register Your Favorite Clubs Events
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-7 flex w-full max-w-[560px] overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-xl">
            <input
              type="text"
              placeholder="Search clubs and events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent px-5 py-3 text-sm text-white outline-none placeholder-gray-300 md:px-6 md:text-base"
            />

            <button
              type="button"
              onClick={onExploreClubs}
              className="bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-5 text-sm font-semibold text-white hover:-translate-y-0.5 md:px-7 md:text-base"
            >
              Search
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={onExploreClubs}
              className="rounded-full bg-[linear-gradient(135deg,#2563eb,#38bdf8)] px-6 py-2.5 text-sm font-semibold shadow-[0_16px_40px_rgba(37,99,235,0.25)] transition duration-300 hover:-translate-y-1 md:px-8 md:py-3 md:text-base"
            >
              Explore Clubs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
