import { useState, useEffect } from "react";
import axios from "axios";

const StudentSuspension = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // student_id or 'bulk'
    const [search, setSearch] = useState("");
    const [filterYear, setFilterYear] = useState("all");
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/api/hod/students", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (err) {
            console.error("Error fetching students:", err);
            setError("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const handleSuspendToggle = async (studentId, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? "restore" : "suspend"} this student?`)) return;

        try {
            setActionLoading(studentId);
            const token = localStorage.getItem("token");
            const response = await axios.post(`http://localhost:5000/api/hod/student/${studentId}/suspend`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setStudents(prev => prev.map(s =>
                s.student_id === studentId ? { ...s, is_suspended: response.data.is_suspended } : s
            ));
        } catch (err) {
            alert("Failed to update status");
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkAction = async (action, target = 'selected') => {
        // action: 'suspend' | 'restore'
        // target: 'selected' | 'all'

        let targetIds = [];
        let confirmMsg = "";

        if (target === 'selected') {
            targetIds = selectedStudentIds;
            confirmMsg = `Are you sure you want to ${action.toUpperCase()} the ${targetIds.length} selected students?`;
        } else {
            targetIds = filteredStudents.map(s => s.student_id);
            confirmMsg = `Are you sure you want to ${action.toUpperCase()} ALL ${targetIds.length} listed students?`;
        }

        if (targetIds.length === 0) return;
        if (!window.confirm(confirmMsg)) return;

        try {
            setActionLoading("bulk");
            const token = localStorage.getItem("token");

            await axios.post("http://localhost:5000/api/hod/students/bulk-suspend", {
                action,
                studentIds: targetIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            const isSuspended = action === "suspend";
            setStudents(prev => prev.map(s =>
                targetIds.includes(s.student_id) ? { ...s, is_suspended: isSuspended } : s
            ));

            if (target === 'selected') setSelectedStudentIds([]);
            alert(`Bulk ${action} successful`);
        } catch (err) {
            alert("Bulk action failed");
        } finally {
            setActionLoading(null);
        }
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
            student.email.toLowerCase().includes(search.toLowerCase());
        const matchesYear = filterYear === "all" || student.year.toString() === filterYear;
        return matchesSearch && matchesYear;
    });

    // Toggle individual checkbox
    const toggleSelection = (id) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    // Toggle "Select All"
    const toggleSelectAll = () => {
        if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(s => s.student_id));
        }
    };

    return (
        <div className="suspension-container">
            <div className="tools-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div className="filters" style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="form-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <select
                        className="form-input"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="all">All Years</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                </div>

                <div className="bulk-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {selectedStudentIds.length > 0 ? (
                        <>
                            <span style={{ fontWeight: 'bold', color: '#6366f1', marginRight: '0.5rem' }}>
                                {selectedStudentIds.length} Selected
                            </span>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleBulkAction('suspend', 'selected')}
                                disabled={actionLoading === "bulk"}
                                style={{ fontSize: '0.9rem' }}
                            >
                                Block Selected
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => handleBulkAction('restore', 'selected')}
                                disabled={actionLoading === "bulk"}
                                style={{ fontSize: '0.9rem' }}
                            >
                                Restore Selected
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn"
                                onClick={() => handleBulkAction('suspend', 'all')}
                                disabled={actionLoading === "bulk" || filteredStudents.length === 0}
                                style={{ fontSize: '0.9rem', color: '#dc2626', border: '1px solid #fee2e2' }}
                            >
                                Block All Listed
                            </button>
                            <button
                                className="btn"
                                onClick={() => handleBulkAction('restore', 'all')}
                                disabled={actionLoading === "bulk" || filteredStudents.length === 0}
                                style={{ fontSize: '0.9rem', color: '#16a34a', border: '1px solid #dcfce7' }}
                            >
                                Restore All Listed
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading students...</div>
            ) : (
                <div className="table-responsive" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table className="management-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'center', width: '50px' }}>
                                    <input
                                        type="checkbox"
                                        checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                        onChange={toggleSelectAll}
                                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Student</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Details</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.student_id} style={{ borderBottom: '1px solid #f1f5f9', background: selectedStudentIds.includes(student.student_id) ? '#eff6ff' : 'transparent' }}>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(student.student_id)}
                                            onChange={() => toggleSelection(student.student_id)}
                                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {student.profile_pic ? <img src={`http://localhost:5000/uploads/${student.profile_pic}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{student.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="badge info" style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '0.8rem' }}>{student.year} Year</div>
                                        <div className="badge warning" style={{ marginLeft: '0.5rem', display: 'inline-block', padding: '0.2rem 0.5rem', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '0.8rem' }}>{student.category}</div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span className={`badge ${student.is_suspended ? 'danger' : 'success'}`} style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: student.is_suspended ? '#fee2e2' : '#dcfce7', color: student.is_suspended ? '#991b1b' : '#166534', fontWeight: 'bold' }}>
                                            {student.is_suspended ? '🚫 Suspended' : '✅ Active'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            className={`btn btn-${student.is_suspended ? 'outline' : 'danger'}`}
                                            onClick={() => handleSuspendToggle(student.student_id, student.is_suspended)}
                                            disabled={actionLoading === student.student_id}
                                            style={{ minWidth: '100px' }}
                                        >
                                            {actionLoading === student.student_id ? "..." : student.is_suspended ? "Unblock" : "Block"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No students found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentSuspension;
