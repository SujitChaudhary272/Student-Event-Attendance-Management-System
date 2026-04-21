export default function Footer() {
  return (
    <footer className="relative z-10 mx-5 mb-5 mt-12 px-6 py-8 text-center text-white md:mx-8 md:px-8">
      <p className="text-sm font-medium text-slate-100 md:text-base">
        &copy; 2026 The Unified Campus Events. All rights reserved.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-5 text-sm font-semibold text-sky-200 md:text-base">
        <a href="#" className="underline-offset-4 hover:text-white hover:underline">
          Facebook
        </a>
        <a href="#" className="underline-offset-4 hover:text-white hover:underline">
          Instagram
        </a>
        <a href="#" className="underline-offset-4 hover:text-white hover:underline">
          LinkedIn
        </a>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-200 md:text-base">
        <a href="#" className="underline-offset-4 hover:text-white hover:underline">
          Privacy Policy
        </a>
        {" | "}
        <a href="#" className="underline-offset-4 hover:text-white hover:underline">
          Terms of Service
        </a>
      </p>
    </footer>
  );
}
