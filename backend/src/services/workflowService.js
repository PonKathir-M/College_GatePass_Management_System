const { PASS_STATUS } = require("../config/constants");
const { isSunday, isHoliday } = require("../utils/helpers");
const { isHosteller } = require("../utils/studentCategory");

exports.getInitialStatus = (studentCategory) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const morningLimit = 9 * 60 + 15; // 9:15 AM
  const eveningLimit = 17 * 60 + 15; // 5:15 PM
  const hosteller = isHosteller(studentCategory);

  // Hosteller cannot apply after 5:15 PM
  if (hosteller && timeInMinutes >= eveningLimit) {
    return "BLOCKED";
  }

  // Sunday/holiday logic
  if (isSunday() || isHoliday(now)) {
    if (hosteller) {
      return "Warden Pending";
    }
    return "HOD Pending";
  }

  // Hosteller early morning
  if (hosteller && timeInMinutes < morningLimit) {
    return "Warden Pending";
  }

  // Normal workflow
  return PASS_STATUS.PENDING;
};

exports.canApplyGatePass = (studentCategory) => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const eveningLimit = 17 * 60 + 15; // 5:15 PM
  const hosteller = isHosteller(studentCategory);

  // Day scholars cannot apply on holidays/Sundays
  if (!hosteller && (isSunday() || isHoliday(now))) {
    return false;
  }

  // Hostellers cannot apply after 5:15 PM
  if (hosteller && timeInMinutes >= eveningLimit) {
    return false;
  }

  return true;
};

exports.getNextApprover = (status, studentCategory, isHolidayFlag = false) => {
  const hosteller = isHosteller(studentCategory);

  if (isHolidayFlag) {
    if (hosteller && status === "Warden Pending") {
      return "HOD";
    }
    if (!hosteller && status === "HOD Pending") {
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
