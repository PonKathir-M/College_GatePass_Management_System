import React from 'react';
import '../../styles/notification.css';

const NotificationDropdown = ({ notifications, onMarkRead, onClose }) => {

    // Helper to format date relative to now
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

            if (diffInSeconds < 60) return 'Just now';

            const minutes = Math.floor(diffInSeconds / 60);
            if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;

            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

            const days = Math.floor(hours / 24);
            if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

            return date.toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': default: return 'ℹ️';
        }
    };

    const getTypeClass = (type) => {
        if (!type) return 'info';
        return type.toLowerCase();
    };

    return (
        <div className="notification-dropdown">
            <div className="notification-header">
                <span className="notification-title">Notifications</span>
                {notifications.length > 0 && (
                    <button className="mark-read-btn" onClick={onMarkRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🔕</span>
                        <span className="empty-text">No new notifications</span>
                        <small style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                            We'll notify you when there's an update!
                        </small>
                    </div>
                ) : (
                    notifications.map((note) => (
                        <div
                            key={note.id || Math.random()}
                            className={`notification-item ${!note.is_read ? 'unread' : ''}`}
                        >
                            <div className={`notification-icon ${getTypeClass(note.type)}`}>
                                {getIcon(note.type)}
                            </div>
                            <div className="notification-content">
                                <div className="notification-message">{note.message}</div>
                                <div className="notification-time">
                                    {formatDate(note.createdAt)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;
