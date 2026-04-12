import api from "./api";

export const hodApprove = (id) =>
  api.post(`/hod/approve/${id}`);

export const hodReject = (id, reason) =>
  api.post(`/hod/reject/${id}`, { reason });
