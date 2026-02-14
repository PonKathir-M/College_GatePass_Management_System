import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/tutor-dashboard.css"; // Reuse existing styles or create new

const AnnouncementsTab = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        target_audience: "all",
        priority: "normal"
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/tutor/announcements", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(response.data);
        } catch (err) {
            console.error("Error fetching announcements:", err);
            setError("Failed to load announcements");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.message) {
            setError("Title and Message are required");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post("http://localhost:5000/api/tutor/announcements", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess("Announcement posted successfully!");
            setFormData({ title: "", message: "", target_audience: "all", priority: "normal" });
            fetchAnnouncements();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Error creating announcement:", err);
            setError("Failed to post announcement");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/tutor/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAnnouncements();
        } catch (err) {
            console.error("Error deleting announcement:", err);
            alert("Failed to delete announcement");
        }
    };

    return (
        <div className="announcements-container">
            <div className="announcements-header">
                <h2>📢 Announcements</h2>
                <p>Broadcast messages to your students</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="announcement-form-card">
                <h3>Post New Announcement</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Tomorrow's Class Cancelled"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Enter your message here..."
                            className="form-input"
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Target Audience</label>
                            <select
                                name="target_audience"
                                value={formData.target_audience}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="all">All My Students</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgent (Highlight)</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary">Post Announcement</button>
                </form>
            </div>

            <div className="announcements-list">
                <h3>📜 Previous Announcements</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : announcements.length === 0 ? (
                    <p className="empty-text">No announcements posted yet.</p>
                ) : (
                    announcements.map((ann) => (
                        <div key={ann.announcement_id} className={`announcement-card ${ann.priority}`}>
                            <div className="ann-header">
                                <strong>{ann.title}</strong>
                                <span className="ann-date">{new Date(ann.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="ann-message">{ann.message}</p>
                            <div className="ann-footer">
                                <span className="ann-badge">Target: {ann.target_audience === 'all' ? 'All' : `${ann.target_audience} Year`}</span>
                                <button className="btn-delete" onClick={() => handleDelete(ann.announcement_id)}>🗑️ Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
        .announcements-container {
          padding: 1rem;
        }
        .announcement-form-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }
        .announcement-card {
          background: white;
          border: 1px solid #eee;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .announcement-card.urgent {
          border-left-color: #ef4444;
          background: #fef2f2;
        }
        .ann-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .ann-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          font-size: 0.85rem;
          color: #666;
        }
        .btn-delete {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
        }
        .btn-delete:hover {
          text-decoration: underline;
        }
        .ann-badge {
          background: #e5e7eb;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
      `}</style>
        </div>
    );
};

export default AnnouncementsTab;
