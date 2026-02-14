const { Notification, User, Student, GatePass } = require("../models");
const { sendSMS } = require("../utils/smsService");

exports.notifyUser = async (userId, message, metadata = {}) => {
  try {
    await Notification.create({
      UserUserId: userId,
      message,
      type: metadata.type || "info",
      reference_id: metadata.reference_id || null
    });
    console.log(`📧 Notified user ${userId}: ${message}`);
  } catch (err) {
    console.error("Notification error:", err);
  }
};

exports.notifyParent = async (studentId, message, metadata = {}) => {
  try {
    const student = await Student.findByPk(studentId, { include: "User" });
    if (student?.parent_phone) {
      // Send SMS (Real or Logged)
      await sendSMS(student.parent_phone, message);

      // Also log notification to database
      await Notification.create({
        UserUserId: student.UserUserId,
        message: `Parent notification: ${message}`,
        type: metadata.type || "parent",
        reference_id: metadata.reference_id || null
      });
      console.log(`📧 Parent Notified (Student: ${student.User?.name})`);
    } else {
      console.warn(`⚠️ No parent phone for student ${studentId}. SMS skipped.`);
    }
  } catch (err) {
    console.error("Parent notification error:", err);
  }
};

exports.notifyTutor = async (gatepassId, message, metadata = {}) => {
  try {
    const gatepass = await GatePass.findByPk(gatepassId, {
      include: {
        association: "Student",
        include: {
          association: "AssignedStaff",
          include: "User"
        }
      }
    });

    if (gatepass?.Student?.AssignedStaff?.User) {
      await exports.notifyUser(gatepass.Student.AssignedStaff.User.user_id, message, metadata);
    } else {
      console.warn(`No tutor assigned for student in gatepass ${gatepassId}`);
    }
  } catch (err) {
    console.error("Tutor notification error:", err);
  }
};

exports.notifySecurityGuard = async (gatepassId, message, metadata = {}) => {
  try {
    const securityUsers = await User.findAll({ where: { role: "security" } });
    for (const user of securityUsers) {
      await exports.notifyUser(user.user_id, message, metadata);
    }
  } catch (err) {
    console.error("Security notification error:", err);
  }
};

exports.notifyHOD = async (departmentId, message, metadata = {}) => {
  try {
    const hod = await User.findOne({
      include: {
        association: "Staff",
        where: { DepartmentDepartmentId: departmentId, role: "hod" }
      }
    });
    if (hod) {
      await exports.notifyUser(hod.user_id, message, metadata);
    }
  } catch (err) {
    console.error("HOD notification error:", err);
  }
};
