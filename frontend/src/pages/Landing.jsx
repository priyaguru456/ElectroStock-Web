import { useNavigate } from "react-router-dom";
import logo from "../assets/warehose image.png";

const FEATURES = [
  {
    title: "Multi-warehouse stock tracking",
    desc: "See live quantities for every product across every warehouse in one place.",
  },
  {
    title: "Purchase & sales workflow",
    desc: "Raise purchase orders, receive stock, and fulfil sales orders with a full audit trail.",
  },
  {
    title: "Low-stock alerts",
    desc: "Get notified automatically before a product falls below its reorder level.",
  },
  {
    title: "Role-based staff access",
    desc: "Admins, warehouse managers, sales managers, and telecallers each see exactly what they need.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <img src={logo} alt="WorkStock" className="landing-logo" />
        <button className="landing-login-btn" onClick={() => navigate("/login")}>
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
          Login
        </button>
      </nav>

      <header className="landing-hero">
        <img src={logo} alt="WorkStock" className="landing-hero-logo" />
        <p>Warehouse and sales inventory management, built for teams that move stock every day.</p>
        <button className="landing-cta" onClick={() => navigate("/login")}>
          Login to your account
        </button>
      </header>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div className="landing-feature-card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} WorkStock. All rights reserved.</span>
      </footer>
    </div>
  );
}
