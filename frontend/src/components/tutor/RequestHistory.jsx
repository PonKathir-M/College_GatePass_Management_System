import { useState, useEffect } from "react";
import axios from "axios";

const RequestHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/tutor/history", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            setError("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    if (loading) return <div className="loading">Loading history...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="requests-container">
            <h2>📜 Approval History</h2>

            {history.length === 0 ? (
                <div className="empty-state">
                    <p>No history found</p>
                </div>
            ) : (
                <div className="requests-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Student</th>
                                <th>Gate Pass ID</th>
                                <th>Action</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((item) => (
                                <tr key={item.id}>
                                    <td>{formatDate(item.createdAt)}</td>
                                    <td>{item.GatePass?.Student?.User?.name || "Unknown"}</td>
                                    <td>{item.GatePassGatepassId}</td>
                                    <td>
                                        <span className={`badge ${item.approved ? "badge-success" : "badge-danger"}`}>
                                            {item.approved ? "✅ Approved" : "❌ Rejected"}
                                        </span>
                                    </td>
                                    <td>{item.reason || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RequestHistory;
