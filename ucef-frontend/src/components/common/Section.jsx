/**
 * Container Component
 * Consistent section container with padding and max-width
 */

export default function Section({
  children,
  className = "",
  padding = "py-section",
  background = "bg-background-cream",
  maxWidth = "max-w-7xl",
  ...props
}) {
  return (
    <section className={`${padding} ${background} ${className}`} {...props}>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        {children}
      </div>
    </section>
  );
}
