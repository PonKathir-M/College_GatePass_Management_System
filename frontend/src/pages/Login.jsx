import { useNavigate } from "react-router-dom";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import ForumIcon from '@mui/icons-material/Forum';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShieldIcon from '@mui/icons-material/Shield';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SettingsIcon from '@mui/icons-material/Settings';

import "../styles/login.css";

const roleCards = [
  {
    key: "student",
    title: "Student",
    action: "Request Pass",
    route: "/student-login",
    iconKey: "student",
    BgIcon: DescriptionIcon,
    pillColor: "#cce5ff",
    pillText: "#004085"
  },
  {
    key: "tutor",
    title: "Tutor",
    action: "Approve Pass",
    route: "/staff",
    iconKey: "parent",
    BgIcon: ForumIcon,
    pillColor: "#d4edda",
    pillText: "#155724"
  },
  {
    key: "hod",
    title: "HOD",
    action: "Manage Requests",
    route: "/staff",
    iconKey: "faculty",
    BgIcon: AssignmentIcon,
    pillColor: "#fff3cd",
    pillText: "#856404"
  },
  {
    key: "security",
    title: "Security",
    action: "Verify Pass",
    route: "/staff",
    iconKey: "security",
    BgIcon: ShieldIcon,
    pillColor: "#e2e3e5",
    pillText: "#383d41"
  },
  {
    key: "warden",
    title: "Warden",
    action: "View Logs",
    route: "/staff",
    iconKey: "warden",
    BgIcon: LibraryBooksIcon,
    pillColor: "#d1ecf1",
    pillText: "#0c5460"
  },
  {
    key: "admin",
    title: "Admin",
    action: "Control Panel",
    route: "/staff",
    iconKey: "admin",
    BgIcon: SettingsIcon,
    pillColor: "#f8d7da",
    pillText: "#721c24"
  }
];

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="gpms-v2-page">
      <header className="gpms-v2-topbar">
        <div className="brand-section">
          <VerifiedUserIcon className="brand-icon" />
          <div className="brand-text">
            <span className="brand-highlight">GatePass</span> Management System
          </div>
        </div>
        <nav className="top-nav-v2">
          <span>Dashboard</span>
          <span className="nav-divider">|</span>
          <span>Reports</span>
          <span className="nav-divider">|</span>
          <span className="nav-dropdown">Support <ExpandMoreIcon fontSize="small" /></span>
          <NotificationsIcon className="bell-icon" />
          <button type="button" className="login-btn">Login</button>
        </nav>
      </header>

      <main className="gpms-v2-main">
        <section className="hero-section">
          <div className="location-tag">
            <HomeIcon fontSize="small" /> National Engineering College, Kovilpatti
          </div>
          <h1>National Engineering College</h1>
          <h2>GatePass Management System</h2>
        </section>

        <section className="role-cards-grid">
          {roleCards.map((card) => (
            <div
              key={card.key}
              className={`role-card-v2 ${card.key}-card`}
              onClick={() => navigate(card.route)}
              role="button"
              tabIndex={0}
            >
              <card.BgIcon className="card-bg-icon" />

              <div className="card-character-container">
                <img
                  src={process.env.PUBLIC_URL + `/images/${card.iconKey}.png`}
                  alt={card.title}
                  className="role-character"
                  onError={(e) => {
                    // Fallback to a transparent placeholder if image is not placed by user yet
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              <div className="card-content-v2">
                <div className="role-title-v2">{card.title}</div>
                <div
                  className="role-action-pill"
                  style={{ backgroundColor: card.pillColor, color: card.pillText }}
                >
                  {card.action}
                </div>
              </div>
            </div>
          ))}
        </section>

        <footer className="gpms-v2-footer">
          <div className="footer-line">
            <div className="dash-line" />
            <p>Efficient. <strong>Secure.</strong> Reliable.</p>
            <div className="dash-line" />
          </div>
          <p className="footer-subtext">Your Gateway to Smart Pass Management</p>
        </footer>
      </main>
    </div>
  );
};

export default Login;
