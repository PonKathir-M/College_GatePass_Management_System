import { useState, useEffect } from "react";
import axios from "axios";

const AnnouncementsWidget = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/student/announcements", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(response.data);
        } catch (err) {
            console.error("Error fetching announcements:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || announcements.length === 0) return null;

    return (
        <div className="announcements-widget">
            <h3>📢 Announcements</h3>
            <div className="announcement-list">
                {announcements.map((ann) => (
                    <div key={ann.announcement_id} className={`announcement-item ${ann.priority}`}>
                        <div className="ann-icon">
                            {ann.priority === 'urgent' ? '🔥' : '📌'}
                        </div>
                        <div className="ann-content">
                            <div className="ann-title">
                                <strong>{ann.title}</strong>
                                <span className="ann-date">{new Date(ann.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p>{ann.message}</p>
                            <span className="ann-author">- {ann.Staff?.User?.name}</span>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .announcements-widget {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
          border: 1px solid #e5e7eb;
        }
        .announcements-widget h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #1f2937;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 0.5rem;
        }
        .announcement-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 0.8rem;
          border-left: 4px solid #3b82f6;
        }
        .announcement-item.urgent {
          background: #fef2f2;
          border-left-color: #ef4444;
        }
        .ann-icon {
          font-size: 1.5rem;
        }
        .ann-title {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        .ann-date {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .ann-author {
          display: block;
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 0.5rem;
          font-style: italic;
        }
      `}</style>
        </div>
    );
};

export default AnnouncementsWidget;
