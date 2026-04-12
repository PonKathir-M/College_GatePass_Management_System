import api from "./api";

export const applyGatePass = (data) =>
  api.post("/student/gatepass", data);

export const getMyPasses = () =>
  api.get("/student/gatepass");

export const getProfile = () =>
  api.get("/student/profile");
