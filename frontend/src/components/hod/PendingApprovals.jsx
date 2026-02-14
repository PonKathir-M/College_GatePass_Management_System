import { useState } from "react";

const PendingApprovals = () => {
  const [reason, setReason] = useState("");

  const requests = [];

  const approve = (id) => {
    alert(`HOD Approved ${id}`);
  };

  const reject = (id) => {
    if (!reason) {
      alert("Rejection reason required");
      return;
    }
    alert(`HOD Rejected ${id} : ${reason}`);
    setReason("");
  };

  return (
    <div className="card">
      <h3>Pending Approvals</h3>
      {requests.map(r => (
        <div key={r.id} className="request">
          <p>{r.student} (Tutor Approved)</p>
          <input
            placeholder="Rejection reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button onClick={() => approve(r.id)}>Approve</button>
          <button onClick={() => reject(r.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
};

export default PendingApprovals;
