import api from "./api";

export const markOut = (id) =>
  api.post(`/security/out/${id}`);

export const markIn = (id) =>
  api.post(`/security/in/${id}`);
