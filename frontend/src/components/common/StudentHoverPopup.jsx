import React from 'react';
import '../styles/student-popup.css';

const StudentHoverPopup = ({ student, extraInfo }) => {
    if (!student) return null;

    // Handle data structure variations
    // Case 1: student prop is the Student model (has User nested)
    // Case 2: student prop is the User model (has Student nested)

    let profileData = {};

    if (student.User) {
        // It's a Student model
        profileData = {
            name: student.User.name,
            email: student.User.email,
            year: student.year,
            dept: student.Department?.department_name,
            category: student.category,
            phone: student.parent_phone,
            pic: student.profile_pic
        };
    } else if (student.Student) {
        // It's a User model (as used in Admin StudentManagement)
        profileData = {
            name: student.name,
            email: student.email,
            year: student.Student.year,
            dept: student.Student.Department?.department_name,
            category: student.Student.category,
            phone: student.Student.parent_phone,
            pic: student.Student.profile_pic
        };
    } else {
        // Fallback or potentially incomplete data
        profileData = {
            name: student.name || "Unknown",
            email: student.email || "N/A",
            year: student.year || "N/A",
            dept: student.department_name || "N/A",
            category: student.category || "N/A",
            phone: student.parent_phone || "N/A",
            pic: student.profile_pic
        };
    }

    const profilePicUrl = profileData.pic
        ? `http://localhost:5000/uploads/${profileData.pic}`
        : null;

    return (
        <div className="student-popup-overlay">
            <div className="student-popup-card">
                <div className="popup-header-bg"></div>

                <div className="popup-profile-wrapper">
                    {profilePicUrl ? (
                        <img
                            src={profilePicUrl}
                            alt={profileData.name}
                            className="popup-profile-img"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="popup-profile-img" style="display:flex;align-items:center;justify-content:center;background:#fff;font-size:3rem">👤</div>'; }}
                        />
                    ) : (
                        <div className="popup-profile-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', fontSize: '3rem' }}>
                            👤
                        </div>
                    )}
                </div>

                <div className="popup-content">
                    <h3 className="popup-name">{profileData.name}</h3>
                    <p className="popup-email">{profileData.email}</p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <span className={`popup-badge ${profileData.category === 'hosteller' ? 'badge-hosteller' : 'badge-day-scholar'}`}>
                            {profileData.category === 'hosteller' ? '🏠 Hosteller' : '📍 Day Scholar'}
                        </span>
                    </div>

                    <div className="popup-details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Department</span>
                            <span className="detail-value">{profileData.dept}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Year</span>
                            <span className="detail-value">{profileData.year || 'N/A'} Year</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Parent Phone</span>
                            <span className="detail-value">{profileData.phone}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Batch</span>
                            <span className="detail-value">2023 - 2027</span>
                        </div>
                    </div>

                    {extraInfo && extraInfo.length > 0 && (
                        <div className="popup-extra-info" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            {extraInfo.map((info, index) => (
                                <div key={index} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{info.label}:</span>
                                    <span style={{ fontWeight: 600, color: info.highlight ? '#e11d48' : '#334155' }}>{info.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentHoverPopup;
