import api from "./api";

export const getPendingRequests = () =>
  api.get("/tutor/pending");

export const approveRequest = (id) =>
  api.post(`/tutor/approve/${id}`);

export const rejectRequest = (id, reason) =>
  api.post(`/tutor/reject/${id}`, { reason });
