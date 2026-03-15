/**
 * Luxury Hero Section Component
 * Premium hero section with decorative elements and responsive layout
 */

export default function LuxuryHero({
  title,
  subtitle,
  children,
  backgroundBg = "bg-primary-dark",
  titleColor = "text-accent-gold",
  showDecorative = true,
  ctaButton = null,
  className = "",
  ...props
}) {
  return (
    <section
      className={`relative py-hero overflow-hidden ${backgroundBg} ${className}`}
      {...props}
    >
      {/* Decorative Circle */}
      {showDecorative && (
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-15 bg-accent-gold blur-3xl"></div>
      )}

      {/* Content Container */}
      <div className="container-luxury relative z-10">
        <div className="max-w-3xl">
          {/* Main Title */}
          {title && (
            <h1
              className={`${titleColor} font-playfair text-5xl font-700 tracking-luxury mb-4 leading-tight`}
            >
              {title}
            </h1>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-background-cream text-opacity-70 font-dm font-300 text-lg tracking-wide mb-8 leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Custom Children Content */}
          {children && <div className="mb-8">{children}</div>}

          {/* CTA Button */}
          {ctaButton && <div className="mt-8">{ctaButton}</div>}
        </div>
      </div>
    </section>
  );
}
