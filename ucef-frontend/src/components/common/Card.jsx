/**
 * Luxury Card Component
 * Premium card component with clean styling and flexible content
 */

export default function Card({
  children,
  className = "",
  elevated = false,
  hover = true,
  padding = "p-6",
  border = true,
  ...props
}) {
  const baseClasses = "bg-white rounded-luxury transition-all duration-luxury";
  const shadowClass = elevated ? "shadow-luxury-lg" : "shadow-luxury";
  const hoverClass = hover ? "hover:shadow-luxury-md" : "";
  const borderClass = border ? "border border-border-light" : "";

  return (
    <div
      className={`${baseClasses} ${shadowClass} ${hoverClass} ${borderClass} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
