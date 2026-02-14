import { useState } from "react";

const PendingRequests = () => {
  const [reason, setReason] = useState("");

  const requests = [
    { id: "GP201", student: "Arun", reason: "Medical" },
    { id: "GP202", student: "Kumar", reason: "Personal" }
  ];

  const approve = (id) => {
    alert(`Approved ${id}`);
  };

  const reject = (id) => {
    if (!reason) {
      alert("Rejection reason required");
      return;
    }
    alert(`Rejected ${id} : ${reason}`);
    setReason("");
  };

  return (
    <div className="card">
      <h3>Pending Requests</h3>
      {requests.map(r => (
        <div key={r.id} className="request">
          <p>{r.student} - {r.reason}</p>
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

export default PendingRequests;
