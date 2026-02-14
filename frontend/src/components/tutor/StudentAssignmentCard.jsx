import { useState } from "react";
import axios from "axios";
import "../styles/student-assignment-card.css";

const StudentAssignmentCard = ({ student, isAssignedToMe, onAssignmentChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/tutor/assign/${student.student_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAssignmentChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign student");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm("Are you sure you want to unassign this student?")) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/tutor/unassign/${student.student_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAssignmentChange();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unassign student");
    } finally {
      setLoading(false);
    }
  };

  const isAssigned = student.AssignedStaffStaffId !== null && student.AssignedStaffStaffId !== undefined;
  const assignedBy = student.AssignedStaff?.User?.name;

  return (
    <div className="student-assignment-card">
      <div className="card-header">
        <div className="student-avatar">👤</div>
        <div className="student-info">
          <h3 className="student-name">{student.User.name}</h3>
          <p className="student-id">ID: {student.student_id}</p>
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">📚 Year:</span>
          <span className="value">{student.year}nd Year</span>
        </div>
        <div className="info-row">
          <span className="label">📧 Email:</span>
          <span className="value">{student.User.email}</span>
        </div>
        <div className="info-row">
          <span className="label">📞 Parent Phone:</span>
          <span className="value">{student.parent_phone || "N/A"}</span>
        </div>
      </div>

      <div className="card-status">
        {isAssigned ? (
          <div className="assigned-status">
            {isAssignedToMe ? (
              <>
                <span className="status-badge assigned">✅ Assigned to You</span>
                <button
                  className="btn btn-unassign"
                  onClick={handleUnassign}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "🗑️ Unassign"}
                </button>
              </>
            ) : (
              <div className="assigned-to-other">
                <span className="status-badge other">🔒 Assigned to {assignedBy}</span>
                <p className="hint">This student is already assigned to another staff member</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="status-badge unassigned">⭕ Not Assigned</span>
            <button
              className="btn btn-assign"
              onClick={handleAssign}
              disabled={loading}
            >
              {loading ? "Processing..." : "✋ Assign to Me"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="card-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentCard;
