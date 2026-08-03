import { useState, useEffect } from "react";
import { getAdminRequests, approveAdminRequest, rejectAdminRequest } from "../api";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [feedback, setFeedback] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAdminRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch access requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id, username) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await approveAdminRequest(id);
      setFeedback({ type: "success", text: `User request for "${username}" approved! Account created.` });
      fetchRequests();
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.error || "Failed to approve request." });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id, username) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await rejectAdminRequest(id);
      setFeedback({ type: "info", text: `User request for "${username}" rejected.` });
      fetchRequests();
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.error || "Failed to reject request." });
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <span className="badge badge-success">APPROVED</span>;
      case "REJECTED":
        return <span className="badge badge-danger">REJECTED</span>;
      default:
        return <span className="badge badge-warning">PENDING</span>;
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div>
          <h1 className="page-title">User Access Requests</h1>
          <p className="page-subtitle">
            Review and approve pending registration applications to grant platform user accounts
          </p>
        </div>
        <button className="secondary-button" onClick={fetchRequests}>
          Refresh
        </button>
      </div>

      {feedback && (
        <div style={{
          marginBottom: "20px",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          background: feedback.type === "success" ? "#ecfdf5" : feedback.type === "error" ? "#fef2f2" : "#eff6ff",
          border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : feedback.type === "error" ? "#fecaca" : "#bfdbfe"}`,
          color: feedback.type === "success" ? "#059669" : feedback.type === "error" ? "#dc2626" : "#2563eb",
        }}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="app-loading">Loading user registration requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state-card">
          <p>No registration requests submitted yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Requested User</th>
                <th>Email</th>
                <th>Reason / Message</th>
                <th>Requested At</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td className="font-semibold">{req.username}</td>
                  <td>{req.email}</td>
                  <td style={{ maxWidth: "300px", color: "#475569" }}>{req.message || "No message provided."}</td>
                  <td style={{ color: "#64748b", fontSize: "13px" }}>{new Date(req.createdAt).toLocaleString()}</td>
                  <td>{getStatusBadge(req.status)}</td>
                  <td style={{ textAlign: "right" }}>
                    {req.status === "PENDING" ? (
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          onClick={() => handleApprove(req._id, req.username)}
                          disabled={actionLoading[req._id]}
                          style={{
                            padding: "6px 14px",
                            background: "#059669",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "12px",
                            cursor: actionLoading[req._id] ? "not-allowed" : "pointer",
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req._id, req.username)}
                          disabled={actionLoading[req._id]}
                          style={{
                            padding: "6px 14px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            fontWeight: "600",
                            fontSize: "12px",
                            cursor: actionLoading[req._id] ? "not-allowed" : "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "13px" }}>Handled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
