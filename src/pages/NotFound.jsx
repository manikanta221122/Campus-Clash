import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="font-display text-6xl font-black text-gradient mb-4">404</p>
      <h1 className="font-display text-xl font-bold text-white mb-2">Match Not Found</h1>
      <p className="text-slate-500 mb-8">This page doesn't exist, or the match has already ended.</p>
      <Link to="/" className="btn-primary inline-block">Back to Home</Link>
    </div>
  );
}
