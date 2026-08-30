import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* glass mesh orbs behind content */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden>
        <div className="orb orb-volt w-[560px] h-[560px] -top-32 -left-40" />
        <div className="orb orb-cyan w-[620px] h-[620px] -top-28 -right-40" />
        <div className="orb orb-volt w-[700px] h-[640px] top-[55%] left-[28%] opacity-30" style={{ filter: "blur(90px)" }} />
      </div>
      <Navbar />
      <main className="flex-1 w-full relative">{children}</main>
      <Footer />
    </div>
  );
}
