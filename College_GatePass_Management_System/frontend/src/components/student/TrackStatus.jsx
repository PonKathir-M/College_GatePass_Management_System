import { useState, useEffect } from "react";
import "../styles/track-status.css";
import { getMyPasses } from "../../services/studentService";

const TrackStatus = () => {
  const [activeRequests, setActiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getMyPasses();
        // Filter only active passes (not Cancelled) or recently approved/rejected
        const active = response.data.filter(pass =>
          !["Cancelled"].includes(pass.status)
        );
        setActiveRequests(active);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load active requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.slice(0, 5);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Helper to determine the state of each tracking step based on pass status
  const getStepState = (passStatus, step) => {
    // Steps: 1=Submitted, 2=Tutor, 3=HOD, 4=Granted

    // Always submitted
    if (step === 1) return "completed";

    // If rejected, mark all subsequent steps as 'rejected' or just the current one? 
    // For simplicity, if status is Rejected, current steps are stopped. 
    // We can mark the review step as rejected.
    if (passStatus === "Rejected") {
      // Assuming rejection happens at Review stage usually, or mark all as error
      return "rejected";
    }

    if (passStatus === "Tutor Pending") {
      if (step === 2) return "active";
      return "pending";
    }

    if (passStatus === "HOD Pending" || passStatus === "Tutor Approved") {
      if (step === 2) return "completed";
      if (step === 3) return "active";
      return "pending";
    }

    if (passStatus === "Warden Pending") { // For hostellers
      if (step === 2) return "active"; // Treat warden step similar to tutor for UI simplicity or add custom logic
      return "pending";
    }

    if (passStatus === "HOD Approved" || passStatus === "Approved") {
      return "completed";
    }

    return "pending";
  };

  const getStatusMessage = (request) => {
    const status = request.status;
    switch (status) {
      case "Tutor Pending": return "Tutor is reviewing your request";
      case "Warden Pending": return "Warden is reviewing your request";
      case "HOD Pending": return "HOD is reviewing your request";
      case "Tutor Approved": return "Tutor approved, awaiting HOD approval";
      case "Rejected": return `❌ Request Rejected: ${request.rejection_reason || "No reason provided"}`;
      case "Approved":
      case "HOD Approved": return "✅ Gate Pass GRANTED! You can exit campus";
      default: return "Processing...";
    }
  };

  if (loading) return <div className="loading-spinner">Loading tracking info...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="track-container">
      <h2>📍 Track Your Requests</h2>

      {activeRequests.length === 0 ? (
        <div className="no-requests">
          <p>📭 No active requests at the moment</p>
        </div>
      ) : (
        activeRequests.map((request) => (
          <div key={request.gatepass_id} className={`track-card ${request.status === 'Rejected' ? 'rejected-card' : ''}`}>
            <div className="request-header">
              <div>
                <h3>{request.gatepass_id}</h3>
                <p className="reason">📝 {request.reason}</p>
              </div>
              <span className="time-badge">
                {formatTime(request.out_time)} - {formatTime(request.expected_return)}
              </span>
            </div>

            <div className="workflow-tracker">
              {/* Step 1: Submitted */}
              <div className="stage">
                <div className={`stage-marker completed`}>✓</div>
                <p className="stage-name">Submitted</p>
                <p className="stage-time">{formatDate(request.createdAt)}</p>
              </div>

              {/* Step 2: Tutor/Warden Review */}
              <div className="stage">
                <div className={`stage-marker ${getStepState(request.status, 2)}`}>
                  {getStepState(request.status, 2) === "completed" ? "✓" :
                    getStepState(request.status, 2) === "rejected" ? "✕" : "⏳"}
                </div>
                <p className="stage-name">Review</p>
              </div>

              {/* Step 3: HOD Approval */}
              <div className="stage">
                <div className={`stage-marker ${getStepState(request.status, 3)}`}>
                  {getStepState(request.status, 3) === "completed" ? "✓" :
                    getStepState(request.status, 3) === "rejected" ? "✕" : "⏳"}
                </div>
                <p className="stage-name">HOD Approval</p>
              </div>

              {/* Step 4: Granted */}
              <div className="stage">
                <div className={`stage-marker ${getStepState(request.status, 4)}`}>
                  {getStepState(request.status, 4) === "completed" ? "✓" :
                    getStepState(request.status, 4) === "rejected" ? "✕" : "⏳"}
                </div>
                <p className="stage-name">Gate Pass Granted</p>
              </div>
            </div>

            <div className="status-message">
              <p className={`message-text ${request.status === 'Rejected' ? 'text-danger' : ''}`}>
                {getStatusMessage(request)}
              </p>
            </div>

            <div className="request-actions">
              <button className="btn btn-primary">View Details</button>
            </div>
          </div>
        ))
      )}

      <div className="info-section">
        <h3>ℹ️ How It Works</h3>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">1️⃣</div>
            <h4>Submit Request</h4>
            <p>Fill in your gate pass details and submit</p>
          </div>
          <div className="info-card">
            <div className="info-icon">2️⃣</div>
            <h4>Review</h4>
            <p>Your Tutor or Warden reviews your request</p>
          </div>
          <div className="info-card">
            <div className="info-icon">3️⃣</div>
            <h4>HOD Approval</h4>
            <p>HOD gives final approval for your pass</p>
          </div>
          <div className="info-card">
            <div className="info-icon">4️⃣</div>
            <h4>Exit Campus</h4>
            <p>Show your approved pass to security guard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackStatus;

