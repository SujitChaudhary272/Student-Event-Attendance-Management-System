export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-black to-purple-900 animate-gradientMove opacity-90"></div>

      {/* Blurred Neon Circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 opacity-30 rounded-full blur-3xl animate-pulse"></div>

      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600 opacity-30 rounded-full blur-3xl animate-pulse"></div>

      {/* Stars Overlay */}
      <div className="absolute inset-0 bg-stars opacity-40"></div>
    </div>
  );
}
