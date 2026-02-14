import { useState, useEffect } from "react";
import axios from "axios";

const LiveStatusBoard = () => {
    const [stats, setStats] = useState({
        students_inside: 0,
        students_outside: 0,
        hostellers_outside: 0,
        late_returns: 0
    });
    const [loading, setLoading] = useState(false);

    const fetchLiveStatus = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/admin/live-status", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (err) {
            console.error("Error fetching live status:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveStatus();
        // Poll every 5 seconds for "live" updates
        const interval = setInterval(fetchLiveStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="live-status-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🔴 Live Status</h2>
                <button
                    onClick={fetchLiveStatus}
                    disabled={loading}
                    style={{
                        background: 'transparent',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem'
                    }}
                >
                    {loading ? 'Updating...' : '🔄 Refresh Now'}
                </button>
            </div>

            <div className="live-status-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

                <div className="status-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, fontWeight: '500' }}>Students Inside</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.students_inside}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>On Campus</div>
                    </div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.2 }}>🏫</div>
                </div>

                <div className="status-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, fontWeight: '500' }}>Students Outside</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.students_outside}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Have not returned</div>
                    </div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.2 }}>🏃</div>
                </div>

                <div className="status-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, fontWeight: '500' }}>Hostellers Outside</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.hostellers_outside}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Currently out</div>
                    </div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.2 }}>🎒</div>
                </div>

                <div className="status-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, fontWeight: '500' }}>Late Returns</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats.late_returns}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Overdue return time</div>
                    </div>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.2 }}>⚠️</div>
                </div>

            </div>
        </div>
    );
};

export default LiveStatusBoard;
