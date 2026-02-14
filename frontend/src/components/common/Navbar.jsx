import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/navbar.css";

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

      const response = await axios.get("http://localhost:5000/api/notifications", {
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
        await axios.post("http://localhost:5000/api/notifications/mark-read", {}, {
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
          <div className="notification-wrapper" style={{ position: 'relative' }}>
            <button
              className="btn-notification"
              onClick={handleNotificationClick}
            >
              🔔
            </button>
            {unreadCount > 0 && (
              <span className="badge-count" style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'red',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {unreadCount}
              </span>
            )}

            {showNotificationMenu && (
              <div className="notification-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 1000,
                width: '300px',
                maxHeight: '400px',
                overflowY: 'auto',
                marginTop: '10px'
              }}>
                <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                  Notifications
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map(note => (
                    <div key={note.id} style={{
                      padding: '10px',
                      borderBottom: '1px solid #eee',
                      backgroundColor: note.is_read ? 'white' : '#f0f7ff',
                      fontSize: '13px'
                    }}>
                      <div style={{ marginBottom: '5px' }}>{note.message}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="profile-wrapper" style={{ position: 'relative' }}>
            <button
              className="btn-profile"
              onClick={handleProfileClick}
            >
              👤
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px',
                marginTop: '10px'
              }}>
                <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                  <strong>{user?.name}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>{user?.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#d9534f'
                  }}
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

