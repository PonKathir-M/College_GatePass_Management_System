import api from "./api";

export const getHostellerRequests = () =>
  api.get("/warden/requests");
