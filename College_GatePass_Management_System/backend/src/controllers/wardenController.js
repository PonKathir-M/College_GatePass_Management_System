const { GatePass, WardenApproval, Student, User, Department } = require("../models");
const { notifyUser, notifyParent } = require("../services/notificationService");

exports.hostellerRequests = async (req, res, next) => {
  try {
    // Get all hosteller early morning requests (before 9:15 AM)
    const students = await Student.findAll({
      where: { category: "Hosteller" }
    });

    const studentIds = students.map(s => s.student_id);

    const passes = await GatePass.findAll({
      where: {
        status: "Warden Pending",
        StudentStudentId: studentIds
      },
      include: [
        {
          association: "Student",
          include: [
            { association: "User" },
            { association: "Department" }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(passes);
  } catch (err) {
    next(err);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const pass = await GatePass.findByPk(req.params.id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    pass.status = "HOD Pending"; // Forward to HOD after warden approval
    await pass.save();

    await WardenApproval.create({
      approved: true,
      GatePassGatepassId: pass.gatepass_id
    });

    // Notify student
    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, "Warden has approved your morning gate pass. Awaiting HOD approval", {
      type: "info",
      reference_id: pass.gatepass_id
    });

    // Notify parent
    await notifyParent(pass.StudentStudentId, "Your ward's morning gate pass approved by Warden", {
      reference_id: pass.gatepass_id
    });

    res.json({ message: "Gate pass approved", pass });
  } catch (err) {
    next(err);
  }
};

exports.reject = async (req, res, next) => {
  try {
    const pass = await GatePass.findByPk(req.params.id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    if (!req.body.reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    pass.status = "Rejected";
    pass.rejection_reason = req.body.reason;
    await pass.save();

    await WardenApproval.create({
      approved: false,
      reason: req.body.reason,
      GatePassGatepassId: pass.gatepass_id
    });

    // Notify student
    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, `Warden rejected your gate pass.\nReason: ${req.body.reason}`, {
      type: "error",
      reference_id: pass.gatepass_id
    });

    // Notify parent
    await notifyParent(pass.StudentStudentId, `Gate pass rejected by Warden.\nReason: ${req.body.reason}`, {
      reference_id: pass.gatepass_id
    });

    res.json({ message: "Gate pass rejected", pass });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const pending = await GatePass.count({ where: { status: "Warden Pending" } });
    const approved = await WardenApproval.count({ where: { approved: true } });
    const rejected = await WardenApproval.count({ where: { approved: false } });

    res.json({
      pending_requests: pending,
      approved_today: approved,
      rejected_today: rejected
    });
  } catch (err) {
    next(err);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { department_id, year } = req.query;

    const where = { category: "Hosteller" }; // Strictly Filter by Hosteller
    if (department_id && department_id !== "all") where.DepartmentDepartmentId = department_id;
    if (year && year !== "all") where.year = year;

    const students = await Student.findAll({
      where,
      include: [
        { model: User, as: "User", attributes: ["name", "email"] },
        { model: Department, as: "Department", attributes: ["department_name"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      attributes: ["department_id", "department_name"]
    });
    res.json(departments);
  } catch (err) {
    next(err);
  }
};
