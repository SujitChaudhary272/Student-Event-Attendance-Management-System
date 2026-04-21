import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = ["home", "clubs", "contact"];
const loginItems = [
  { label: "Login as Admin", path: "/admin/login" },
  { label: "Login as Organizer", path: "/organizer/login" },
  { label: "Login as Student", path: "/student/login" },
];
const registerItems = [
  { label: "Register as Admin", path: "/admin/login?mode=register" },
  { label: "Register as Student", path: "/register" },
];

export default function Navbar({
  onNavigateSection,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  const handleNavClick = (section) => {
    if (location.pathname === "/" && onNavigateSection) {
      onNavigateSection(section);
      setOpenMenu(null);
      return;
    }

    navigate("/", { state: { scrollTo: section } });
    setOpenMenu(null);
  };

  const formatLabel = (item) => item.charAt(0).toUpperCase() + item.slice(1);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname, location.search]);

  return (
    <nav
      ref={menuRef}
      className="absolute top-0 z-50 flex w-full items-center justify-between px-5 py-4 text-white md:px-8 md:py-5"
    >
      <h1 className="text-lg font-bold tracking-wide md:text-xl">
        Campus Events
      </h1>

      <ul className="hidden gap-6 font-medium md:flex">
        {navItems.map((item) => (
          <li
            key={item}
            onClick={() => handleNavClick(item)}
            className="cursor-pointer text-sm transition hover:-translate-y-0.5 hover:text-cyan-200 md:text-base"
          >
            {formatLabel(item)}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <AuthMenu
          label="Login"
          items={loginItems}
          isOpen={openMenu === "login"}
          onToggle={() => setOpenMenu((current) => (current === "login" ? null : "login"))}
          onSelect={(path) => {
            navigate(path);
            setOpenMenu(null);
          }}
        />
        <AuthMenu
          label="Register"
          items={registerItems}
          isOpen={openMenu === "register"}
          onToggle={() => setOpenMenu((current) => (current === "register" ? null : "register"))}
          onSelect={(path) => {
            navigate(path);
            setOpenMenu(null);
          }}
          variant="secondary"
        />
      </div>
    </nav>
  );
}

function AuthMenu({ label, items, isOpen, onToggle, onSelect, variant = "primary" }) {
  const buttonClassName =
    variant === "secondary"
      ? "inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/20 md:px-5 md:text-base"
      : "ucef-primary-btn !rounded-xl !px-4 !py-2 !text-sm md:!px-5 md:!text-base";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/20 bg-slate-950/85 p-2 text-left shadow-[0_24px_60px_rgba(15,23,42,0.38)] backdrop-blur-xl">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(item.path)}
              className="block w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
