import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/hod-dashboard.css";

const TrackingTab = () => {
    const [data, setData] = useState({
        overdueDeparture: [],
        currentlyOut: [],
        overdueReturn: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTrackingData();
        const interval = setInterval(fetchTrackingData, 60000); // 1 min auto-refresh
        return () => clearInterval(interval);
    }, []);

    const fetchTrackingData = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/hod/tracking", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
        } catch (err) {
            console.error("Failed to fetch tracking data", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return "--:--";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="loading-spinner">Loading tracking info...</div>;

    return (
        <div className="tracking-wrapper">

            {/* Overdue Departure Section */}
            <div className={`track-section ${data.overdueDeparture.length > 0 ? 'danger-section' : ''}`}>
                <div className="section-header">
                    <div className="header-title">
                        <h3>🚨 Overdue Departure</h3>
                        <span className="count-badge danger">{data.overdueDeparture.length}</span>
                    </div>
                    <p>Appoved but haven't left campus yet (Past Out-Time)</p>
                </div>

                {data.overdueDeparture.length === 0 ? (
                    <div className="empty-state">
                        <span>✅ No overdue departures</span>
                    </div>
                ) : (
                    <div className="track-card-list">
                        {data.overdueDeparture.map(pass => (
                            <div key={pass.gatepass_id} className="track-card danger">
                                <div className="card-top">
                                    <div className="student-profile">
                                        <div className="avatar-small">
                                            {pass.Student?.profile_pic ?
                                                <img src={`http://localhost:5000/uploads/${pass.Student.profile_pic}`} alt="" /> :
                                                '👤'
                                            }
                                        </div>
                                        <div>
                                            <strong>{pass.Student?.User?.name}</strong>
                                            <span>{pass.Student?.year}nd Year</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-bot">
                                    <div className="time-block">
                                        <span className="label">Expected Out</span>
                                        <span className="time">{pass.out_time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Currently Out Section */}
            <div className="track-section success-section">
                <div className="section-header">
                    <div className="header-title">
                        <h3>🏃 Currently Outside</h3>
                        <span className="count-badge success">{data.currentlyOut.length}</span>
                    </div>
                    <p>Students currently outside campus premises</p>
                </div>

                {data.currentlyOut.length === 0 ? (
                    <div className="empty-state">
                        <span>🏫 All students are on campus</span>
                    </div>
                ) : (
                    <div className="track-card-list">
                        {data.currentlyOut.map(log => (
                            <div key={log.id} className="track-card success">
                                <div className="card-top">
                                    <div className="student-profile">
                                        <div className="avatar-small">
                                            {log.GatePass?.Student?.profile_pic ?
                                                <img src={`http://localhost:5000/uploads/${log.GatePass.Student.profile_pic}`} alt="" /> :
                                                '👤'
                                            }
                                        </div>
                                        <div>
                                            <strong>{log.GatePass?.Student?.User?.name}</strong>
                                            <span>{log.GatePass?.Student?.Department?.department_name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-bot">
                                    <div className="time-block">
                                        <span className="label">Out At</span>
                                        <span className="time">{formatTime(log.actual_out)}</span>
                                    </div>
                                    <div className="time-block right">
                                        <span className="label">Return By</span>
                                        <span className="time">{log.GatePass?.expected_return}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Overdue Return Section */}
            <div className={`track-section ${data.overdueReturn.length > 0 ? 'critical-section' : ''}`}>
                <div className="section-header">
                    <div className="header-title">
                        <h3>⚠️ Overdue Return</h3>
                        <span className="count-badge critical">{data.overdueReturn.length}</span>
                    </div>
                    <p>Students outside past their return time</p>
                </div>

                {data.overdueReturn.length === 0 ? (
                    <div className="empty-state">
                        <span>✅ No overdue returns</span>
                    </div>
                ) : (
                    <div className="track-card-list">
                        {data.overdueReturn.map(log => (
                            <div key={log.id} className="track-card critical">
                                <div className="card-top">
                                    <div className="student-profile">
                                        <div className="avatar-small">
                                            {log.GatePass?.Student?.profile_pic ?
                                                <img src={`http://localhost:5000/uploads/${log.GatePass.Student.profile_pic}`} alt="" /> :
                                                '👤'
                                            }
                                        </div>
                                        <div>
                                            <strong>{log.GatePass?.Student?.User?.name}</strong>
                                            <span style={{ color: '#b91c1c' }}>Late Return</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-bot">
                                    <div className="time-block">
                                        <span className="label">Left At</span>
                                        <span className="time">{formatTime(log.actual_out)}</span>
                                    </div>
                                    <div className="time-block right">
                                        <span className="label">Expected Return</span>
                                        <span className="time critical">{log.GatePass?.expected_return}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingTab;
