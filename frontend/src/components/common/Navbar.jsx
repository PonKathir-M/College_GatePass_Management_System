import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/navbar.css";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("http://localhost:5001/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.warn("Failed to fetch notifications");
    }
  };

  const handleNotificationClick = async () => {
    if (!showNotificationMenu) {
      // Opening the menu - mark all as read
      try {
        const token = localStorage.getItem("token");
        await axios.post("http://localhost:5001/api/notifications/mark-read", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Update local state to show read
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        console.error("Failed to mark notifications read", err);
      }
    }
    setShowNotificationMenu(!showNotificationMenu);
    setShowProfileMenu(false); // Close profile if open
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotificationMenu(false); // Close notifications if open
  };

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h3>🎓 College Gate Pass</h3>
      </div>

      <div className="navbar-right">
        <div className="user-info">
          <span className="user-role">{user?.role?.toUpperCase()}</span>
          <span className="user-name">{user?.name}</span>
        </div>

        <div className="navbar-actions">
          <div className="notification-wrapper">
            <button
              className="btn-notification"
              onClick={handleNotificationClick}
            >
              🔔
            </button>
            {unreadCount > 0 && (
              <span className="badge-count">
                {unreadCount}
              </span>
            )}

            {showNotificationMenu && (
              <NotificationDropdown
                notifications={notifications}
                onMarkRead={handleNotificationClick} // Re-using existing handler which marks as read
                onClose={() => setShowNotificationMenu(false)}
              />
            )}
          </div>

          <div className="profile-wrapper">
            <button
              className="btn-profile"
              onClick={handleProfileClick}
            >
              👤
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-meta">
                  <strong>{user?.name}</strong>
                  <div className="profile-email">{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="profile-logout-btn"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


