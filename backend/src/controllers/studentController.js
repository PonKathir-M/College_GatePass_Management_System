const {
  GatePass,
  Student,
  User,
  Announcement
} = require("../models");
const { Op } = require("sequelize");
const generateId = require("../utils/generateGatePassId");
const { getInitialStatus, canApplyGatePass } = require("../services/workflowService");
const { notifyUser, notifyParent, notifyTutor, notifyHOD } = require("../services/notificationService");

exports.applyGatePass = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const student = await Student.findOne({ where: { UserUserId: user.user_id } });

    if (!student) return res.status(404).json({ message: "Student profile not found" });

    // Check if student is suspended
    if (student.is_suspended) {
      return res.status(403).json({ message: "You are currently suspended from applying for gate passes. Please contact your HOD." });
    }

    // Check if student can apply
    if (!canApplyGatePass(student.category)) {
      const now = new Date();
      if (student.category !== "Hosteller" && (isSunday() || isHoliday(now))) {
        return res.status(403).json({ message: "Day Scholars cannot apply for gate pass on holidays/Sundays" });
      }
      return res.status(403).json({ message: "Hostellers cannot apply for gate pass after 5:15 PM" });
    }

    const status = getInitialStatus(student.category);

    const pass = await GatePass.create({
      gatepass_id: generateId(),
      reason: req.body.reason,
      out_time: req.body.out_time,
      expected_return: req.body.expected_return,
      status,
      StudentStudentId: student.student_id
    });

    // Send notifications
    await notifyUser(user.user_id, "Your gate pass request has been submitted", {
      type: "success",
      reference_id: pass.gatepass_id
    });

    // Notify Parent
    await notifyParent(student.student_id, `Your ward ${user.name} has applied for a gate pass. Reason: ${req.body.reason}`, {
      reference_id: pass.gatepass_id
    });

    if (status === "Warden Pending") {
      const warden = await User.findOne({ where: { role: "warden" } });
      if (warden) {
        await notifyUser(warden.user_id, `New gate pass from ${user.name}`, {
          type: "pending",
          reference_id: pass.gatepass_id
        });
      }

      // If it is a holiday, also notify the assigned Tutor (Informational only)
      const { isHoliday, isSunday } = require("../utils/helpers");
      if (isSunday() || isHoliday(new Date())) {
        await notifyTutor(pass.gatepass_id, `Info: Hosteller ${user.name} applied for gate pass (Direct Warden Approval)`, {
          type: "info",
          reference_id: pass.gatepass_id
        });
      }
    } else if (status === "HOD Pending") {
      await notifyHOD(student.DepartmentDepartmentId, `Direct gate pass approval needed from ${user.name}`, {
        reference_id: pass.gatepass_id
      });
    } else {
      await notifyTutor(pass.gatepass_id, `New gate pass from ${user.name} awaiting your approval`, {
        reference_id: pass.gatepass_id
      });
    }

    res.status(201).json({
      message: "Gate pass request submitted successfully",
      gatepass_id: pass.gatepass_id,
      data: pass
    });
  } catch (err) {
    next(err);
  }
};

exports.myGatePasses = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const student = await Student.findOne({ where: { UserUserId: user.user_id } });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const passes = await GatePass.findAll({
      where: { StudentStudentId: student.student_id },
      order: [["createdAt", "DESC"]]
    });

    res.json(passes);
  } catch (err) {
    next(err);
  }
};

exports.getGatePassDetail = async (req, res, next) => {
  try {
    const pass = await GatePass.findByPk(req.params.id, {
      include: ["Student"]
    });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    res.json(pass);
  } catch (err) {
    next(err);
  }
};

exports.cancelGatePass = async (req, res, next) => {
  try {
    const pass = await GatePass.findByPk(req.params.id);

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    if (["HOD Approved", "Rejected"].includes(pass.status)) {
      return res.status(400).json({ message: "Cannot cancel approved or rejected passes" });
    }

    pass.status = "Cancelled";
    await pass.save();

    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, "Your gate pass has been cancelled", {
      type: "info",
      reference_id: pass.gatepass_id
    });

    res.json({ message: "Gate pass cancelled", pass });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const student = await Student.findOne({
      where: { UserUserId: user.user_id },
      include: "Department"
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.json({
      user,
      student
    });
  } catch (err) {
    next(err);
  }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    const student = await Student.findOne({ where: { UserUserId: user.user_id } });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const announcements = await Announcement.findAll({
      where: {
        DepartmentDepartmentId: student.DepartmentDepartmentId,
        is_active: true,
        [Op.or]: [
          { target_audience: "all" },
          { target_audience: student.year.toString() }
        ]
      },
      include: {
        association: "Staff",
        include: { association: "User", attributes: ["name"] }
      },
      order: [["priority", "DESC"], ["createdAt", "DESC"]]
    });

    res.json(announcements);
  } catch (err) {
    next(err);
  }
};
