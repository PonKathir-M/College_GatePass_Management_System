const { PASS_STATUS } = require("../config/constants");
const { isSunday, isHoliday, currentHour } = require("../utils/helpers");

exports.getInitialStatus = (studentCategory) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const morningLimit = 9 * 60 + 15; // 9:15 AM
  const eveningLimit = 17 * 60 + 15; // 5:15 PM

  // Check if hosteller trying to apply after 5:15 PM (not allowed)
  if (studentCategory === "Hosteller" && timeInMinutes >= eveningLimit) {
    return "BLOCKED"; // System should prevent application
  }

  // Sunday / holiday logic
  if (isSunday() || isHoliday(now)) {
    if (studentCategory === "Hosteller") {
      return "Warden Pending"; // Hosteller → Warden → HOD
    }
    return "HOD Pending"; // Day scholar → Direct HOD
  }

  // Hosteller early morning (before 9:15 AM)
  if (studentCategory === "Hosteller" && timeInMinutes < morningLimit) {
    return "Warden Pending";
  }

  // Normal workflow: Tutor pending
  return PASS_STATUS.PENDING;
};

exports.canApplyGatePass = (studentCategory) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const eveningLimit = 17 * 60 + 15; // 5:15 PM

  // Day Scholars: Cannot apply on holidays/Sundays
  if (studentCategory !== "Hosteller" && (isSunday() || isHoliday(now))) {
    return false;
  }

  // Hostellers: Cannot apply after 5:15 PM
  if (studentCategory === "Hosteller" && timeInMinutes >= eveningLimit) {
    return false;
  }

  return true;
};

exports.getNextApprover = (status, studentCategory, isHoliday = false) => {
  if (isHoliday) {
    if (studentCategory === "Hosteller" && status === "Warden Pending") {
      return "HOD";
    }
    if (studentCategory === "Day Scholar" && status === "HOD Pending") {
      return "HOD";
    }
  }

  switch (status) {
    case "Warden Pending":
      return "Warden";
    case "Pending":
      return "Tutor";
    case "Tutor Approved":
      return "HOD";
    case "HOD Pending":
      return "HOD";
    default:
      return null;
  }
};
