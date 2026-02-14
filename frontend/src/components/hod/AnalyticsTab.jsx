import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from "axios";
import "../styles/hod-dashboard.css"; // Reuse dashboard styles

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsTab = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/hod/stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    if (!stats) return <div className="loading-spinner">Loading Analytics...</div>;

    const pieData = [
        { name: 'Approved', value: stats.approved },
        { name: 'Rejected', value: stats.rejected },
        { name: 'Pending', value: stats.pending },
    ];

    return (
        <div className="analytics-wrapper">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📄</div>
                    <div className="stat-content">
                        <p>Total Requests</p>
                        <h3>{stats.total}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <p>Approved</p>
                        <h3>{stats.approved}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                        <p>Rejected</p>
                        <h3>{stats.rejected}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <p>Pending</p>
                        <h3>{stats.pending}</h3>
                    </div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-box">
                    <h3>📅 Gate Pass Trends (Last 7 Days)</h3>
                    <div style={{ height: 300 }}>
                        {stats.chartData && stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#8884d8" name="Passes" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-data">No sufficient data for trends</div>
                        )}
                    </div>
                </div>

                <div className="chart-box">
                    <h3>🍰 Approval Distribution</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
