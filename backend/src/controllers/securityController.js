const { SecurityLog, GatePass, Student, User, Department, Staff } = require("../models");
const { notifyUser, notifyParent, notifyHOD } = require("../services/notificationService");

exports.getApprovedPasses = async (req, res, next) => {
  try {
    const passes = await GatePass.findAll({
      where: { status: "HOD Approved" },
      include: [
        {
          model: Student,
          include: [
            { model: User, as: "User" }, // Student Name
            { model: Department, as: "Department" }, // Department Name
            {
              model: Staff,
              as: "AssignedStaff",
              include: [{ model: User, as: "User" }] // Tutor Name
            }
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

exports.getLogs = async (req, res, next) => {
  try {
    const logs = await SecurityLog.findAll({
      include: [
        {
          model: GatePass,
          include: [
            {
              model: Student,
              include: [
                { model: User, as: "User" }, // Student Name for log
                { model: Department, as: "Department" }
              ]
            }
          ]
        },
        { model: User, as: "CheckedOutBy" }, // Guard who marked out
        { model: User, as: "CheckedInBy" }   // Guard who marked in
      ],
      order: [["createdAt", "DESC"]],
      limit: 100
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
};

exports.markStudentOut = async (req, res, next) => {
  try {
    const { gatepass_id } = req.body;

    const pass = await GatePass.findByPk(gatepass_id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    if (pass.status !== "HOD Approved") {
      return res.status(400).json({ message: "Only approved passes can be marked OUT" });
    }

    // Check for existing log
    let log = await SecurityLog.findOne({ where: { GatePassGatepassId: gatepass_id } });

    if (!log) {
      log = await SecurityLog.create({
        GatePassGatepassId: gatepass_id,
        actual_out: new Date(),
        checked_by: req.user.id
      });
    } else if (!log.actual_out) {
      log.actual_out = new Date();
      log.checked_out_by = req.user.id;
      await log.save();
    }

    // Notify student and parent
    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, "You have been marked OUT from campus", {
      type: "alert",
      reference_id: gatepass_id
    });

    await notifyParent(pass.StudentStudentId, `Your ward left campus at ${new Date().toLocaleTimeString()}`, {
      reference_id: gatepass_id
    });

    res.json({ message: "Student marked OUT", log });
  } catch (err) {
    next(err);
  }
};

exports.markStudentIn = async (req, res, next) => {
  try {
    const { gatepass_id } = req.body;

    const pass = await GatePass.findByPk(gatepass_id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    const log = await SecurityLog.findOne({ where: { GatePassGatepassId: gatepass_id } });

    if (!log) {
      return res.status(400).json({ message: "Student must be marked OUT first" });
    }

    log.actual_in = new Date();
    log.checked_in_by = req.user.id;
    await log.save();

    // Mark pass as completed
    pass.status = "Completed";
    await pass.save();

    // Notify student and parent
    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, "You have been marked IN to campus", {
      type: "alert",
      reference_id: gatepass_id
    });

    await notifyParent(pass.StudentStudentId, `Your ward returned to campus at ${new Date().toLocaleTimeString()}`, {
      reference_id: gatepass_id
    });

    // Notify HOD
    await notifyHOD(student.DepartmentDepartmentId, `${student.User.name} has returned from approved gate pass`, {
      reference_id: gatepass_id
    });

    res.json({ message: "Student marked IN", log });
  } catch (err) {
    next(err);
  }
};

exports.getCompletedPasses = async (req, res, next) => {
  try {
    const passes = await GatePass.findAll({
      where: { status: "Completed" },
      include: [
        {
          model: Student,
          include: [
            { model: User, as: "User" },
            { model: Department, as: "Department" }
          ]
        },
        {
          model: SecurityLog,
          include: [
            { model: User, as: "CheckedOutBy" },
            { model: User, as: "CheckedInBy" }
          ]
        } // Include log with security guard details
      ],
      order: [["updatedAt", "DESC"]],
      limit: 50
    });

    res.json(passes);
  } catch (err) {
    next(err);
  }
};

exports.getTodayStats = async (req, res, next) => {
  try {
    const today = new Date().toDateString();

    const logsToday = await SecurityLog.findAll({
      where: { createdAt: { [require("sequelize").Op.gte]: new Date(today) } }
    });

    const marked_out = logsToday.filter(l => l.actual_out).length;
    const marked_in = logsToday.filter(l => l.actual_in).length;

    res.json({
      total_checked_out: marked_out,
      total_checked_in: marked_in,
      currently_outside: marked_out - marked_in
    });
  } catch (err) {
    next(err);
  }
};
