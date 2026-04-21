import { Link } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function ClubCard({ club }) {
  const logoSrc = club.image
    ? club.image.startsWith("http")
      ? club.image
      : `${BACKEND}${club.image}`
    : "/placeholder.png";

  return (
    <Link to={`/club/${club.id}`}>
      <div className="group ucef-card ucef-card-hover cursor-pointer p-6">
        <img
          src={logoSrc}
          alt={club.name}
          className="mx-auto h-16 w-16 transition duration-300 group-hover:scale-110"
        />

        <h2 className="mt-4 text-center text-xl font-bold text-slate-900">
          {club.name}
        </h2>

        <p className="mt-3 text-center text-sm text-slate-500">
          {club.description}
        </p>

        <button className="ucef-primary-btn mt-5 w-full !py-2">
          {"View Events ->"}
        </button>
      </div>
    </Link>
  );
}
