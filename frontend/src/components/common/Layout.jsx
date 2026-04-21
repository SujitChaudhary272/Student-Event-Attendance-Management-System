/**
 * Layout Component
 * Main layout wrapper with sticky navigation and footer
 */

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({
  children,
  showNavigation = true,
  showFooter = true,
  className = "",
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background-cream">
      {/* Navigation */}
      {showNavigation && <Navbar />}

      {/* Main Content */}
      <main className={`flex-grow ${className}`}>
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
