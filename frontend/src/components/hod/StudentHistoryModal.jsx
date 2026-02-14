import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/student-popup.css'; // Reuse popup styles

const StudentHistoryModal = ({ studentId, onClose, apiEndpoint }) => {
    const [historyData, setHistoryData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            fetchHistory();
        }
    }, [studentId]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = apiEndpoint
                ? `${apiEndpoint}/${studentId}`
                : `http://localhost:5000/api/hod/student-history/${studentId}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoryData(response.data);
        } catch (error) {
            console.error("Error fetching student history", error);
        } finally {
            setLoading(false);
        }
    };

    if (!studentId) return null;

    return (
        <div className="student-popup-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="student-popup-card modal-view" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>&times;</button>

                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading history...</div>
                ) : historyData ? (
                    <>
                        {/* Header / Profile Section */}
                        <div className="popup-header-bg"></div>
                        <div className="popup-profile-wrapper">
                            {historyData.student?.profile_pic ? (
                                <img src={`http://localhost:5000/uploads/${historyData.student.profile_pic}`} alt="" className="popup-profile-img" />
                            ) : (
                                <div className="popup-profile-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', fontSize: '3rem' }}>👤</div>
                            )}
                        </div>

                        <div className="popup-content">
                            <h3 className="popup-name">{historyData.student?.User?.name}</h3>
                            <p className="popup-email">{historyData.student?.User?.email}</p>

                            <div className="history-stats-row">
                                <div className="stat-pill total">
                                    <span className="label">Total Applied</span>
                                    <span className="value">{historyData.stats?.total}</span>
                                </div>
                                <div className="stat-pill approved">
                                    <span className="label">Granted</span>
                                    <span className="value">{historyData.stats?.approved}</span>
                                </div>
                                <div className="stat-pill rejected">
                                    <span className="label">Rejected</span>
                                    <span className="value">{historyData.stats?.rejected}</span>
                                </div>
                            </div>

                            <div className="history-list-container">
                                <h4>📜 Gate Pass History</h4>
                                <div className="history-list">
                                    {historyData.history?.map(pass => (
                                        <div key={pass.gatepass_id} className={`history-item ${pass.status.toLowerCase().replace(' ', '-')}`}>
                                            <div className="h-header">
                                                <span className="h-date">{new Date(pass.createdAt).toLocaleDateString()}</span>
                                                <span className={`h-status status-${pass.status === 'HOD Approved' || pass.status === 'Completed' ? 'approved' : pass.status === 'Rejected' ? 'rejected' : 'pending'}`}>
                                                    {pass.status}
                                                </span>
                                            </div>
                                            <div className="h-reason">{pass.reason}</div>
                                            {pass.rejection_reason && (
                                                <div className="h-rejection-msg">Reason: {pass.rejection_reason}</div>
                                            )}
                                        </div>
                                    ))}
                                    {historyData.history?.length === 0 && <p className="no-history">No history found.</p>}
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <button className="btn btn-danger" onClick={onClose} style={{ padding: '0.8rem 2rem', width: '100%', borderRadius: '8px' }}>
                                    Close
                                </button>
                            </div>

                        </div>
                    </>
                ) : (
                    <div style={{ padding: '20px' }}>Failed to load data</div>
                )}
            </div>
        </div>
    );
};

export default StudentHistoryModal;
