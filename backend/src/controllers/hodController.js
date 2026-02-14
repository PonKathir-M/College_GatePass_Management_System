const { GatePass, WardenApproval, Student, User, SecurityLog, sequelize } = require("../models");
const { PASS_STATUS } = require("../config/constants");
const { notifyUser, notifyParent, notifySecurityGuard } = require("../services/notificationService");
const moment = require("moment");
const { Op } = require("sequelize");

exports.pending = async (req, res, next) => {
  try {
    const passes = await GatePass.findAll({
      where: {
        status: ["Tutor Approved", "HOD Pending"]
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

    pass.status = "HOD Approved";
    await pass.save();

    // Notify student
    const student = await Student.findByPk(pass.StudentStudentId, {
      include: ["User", "Department"]
    });
    await notifyUser(student.User.user_id, "Gate pass GRANTED! You are approved to leave campus", {
      type: "success",
      reference_id: pass.gatepass_id
    });

    // Notify parent
    await notifyParent(pass.StudentStudentId, `Gate pass approved. Your ward can leave campus.\nOut: ${pass.out_time}\nExpected Return: ${pass.expected_return}`, {
      reference_id: pass.gatepass_id
    });

    // Notify security
    await notifySecurityGuard(pass.gatepass_id, `Gate pass ${pass.gatepass_id} approved. ${student.User.name} from ${student.Department.department_name}`, {
      type: "alert",
      reference_id: pass.gatepass_id
    });

    res.json({ message: "Gate pass granted", pass });
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

    pass.status = PASS_STATUS.REJECTED;
    pass.rejection_reason = req.body.reason;
    await pass.save();

    // Notify student
    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, `Gate pass REJECTED by HOD.\nReason: ${req.body.reason}`, {
      type: "error",
      reference_id: pass.gatepass_id
    });

    // Notify parent
    await notifyParent(pass.StudentStudentId, `Gate pass rejected by HOD.\nReason: ${req.body.reason}`, {
      reference_id: pass.gatepass_id
    });

    res.json({ message: "Gate pass rejected", pass });
  } catch (err) {
    next(err);
  }
};

exports.approveWarden = async (req, res, next) => {
  try {
    const pass = await GatePass.findByPk(req.params.id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    // When warden approves early morning hosteller, HOD is notified
    pass.status = "HOD Pending";
    await pass.save();

    // Notify HOD
    const student = await Student.findByPk(pass.StudentStudentId);
    const hod = await User.findOne({
      include: {
        association: "Staff",
        where: { DepartmentDepartmentId: student.DepartmentDepartmentId }
      }
    });

    if (hod) {
      await notifyUser(hod.user_id, `Early morning pass approved by Warden. ${student.User.name} needs final approval`, {
        reference_id: pass.gatepass_id
      });
    }

    res.json({ message: "Gate pass forwarded to HOD", pass });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const today = moment().startOf('day');

    const total = await GatePass.count();
    const approved = await GatePass.count({ where: { status: "HOD Approved" } });
    const rejected = await GatePass.count({ where: { status: "Rejected" } });
    const pending = await GatePass.count({
      where: { status: ["Pending", "Tutor Approved", "HOD Pending"] }
    });

    const rawStats = await GatePass.findAll({
      attributes: [
        [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('count', sequelize.col('gatepass_id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: moment().subtract(6, 'days').startOf('day').toDate()
        }
      },
      group: [sequelize.fn('date', sequelize.col('createdAt'))],
      order: [[sequelize.fn('date', sequelize.col('createdAt')), 'ASC']]
    });

    // Process to ensure all 7 days are present
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const found = rawStats.find(s => s.get('date') === dateStr);
      chartData.push({
        date: moment(dateStr).format('MMM DD'), // Format for frontend
        count: found ? parseInt(found.get('count')) : 0
      });
    }

    res.json({
      total,
      approved,
      rejected,
      pending,
      chartData: chartData
    });
  } catch (err) {
    next(err);
  }
};

exports.getPassTracking = async (req, res, next) => {
  try {
    const now = moment();

    // 1. Overdue Departure: Approved passes where Current Time > Out Time AND Student NOT marked OUT
    const overdueDeparture = await GatePass.findAll({
      where: {
        status: "HOD Approved",
        out_time: { [Op.lt]: now.format("HH:mm:ss") }
        // Note: Comparing time strings directly can be tricky, ideally we compare Full DateTimes.
        // Assuming out_time is just TIME, we check if today's date + out_time < now.
        // For simplicity in this demo, we'll fetch all HOD Approved and filter in JS if needed.
      },
      include: [
        { model: Student, include: ["User"] },
        { model: SecurityLog } // To check if log exists (means marked out)
      ]
    });

    // Filter those who are NOT in security log (not checked out)
    const overdueDepartureFiltered = overdueDeparture.filter(p => !p.SecurityLog);

    // 2. Currently Out: Status is 'HOD Approved' or 'Completed' (if marked In, they are back)
    // Actually simpler: Security Log exists with actual_out BUT NO actual_in
    const currentlyOut = await SecurityLog.findAll({
      where: {
        actual_out: { [Op.ne]: null },
        actual_in: null
      },
      include: [
        {
          model: GatePass,
          include: [{ model: Student, include: ["User", "Department"] }]
        }
      ]
    });

    // 3. Overdue Return: Currently Out AND Current Time > Expected Return
    const overdueReturn = currentlyOut.filter(log => {
      // Logic depends on if expected_return is just time or datetime
      // Assuming today for simplicity or if expected_return is DateTime
      // basic comparison:
      if (!log.GatePass.expected_return) return false;

      // This logic might need refinement based on exact data types
      const returnTime = moment(log.GatePass.expected_return, "HH:mm:ss");
      // If return time is earlier than now (on same day), then overdue
      return moment().isAfter(returnTime);
    });

    res.json({
      overdueDeparture: overdueDepartureFiltered,
      currentlyOut,
      overdueReturn
    });

  } catch (err) {
    next(err);
  }
};

exports.getStudentHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({
      where: { student_id: studentId },
      include: ["User", "Department"]
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const history = await GatePass.findAll({
      where: { StudentStudentId: studentId },
      order: [['createdAt', 'DESC']]
    });

    const stats = {
      total: history.length,
      approved: history.filter(p => p.status === 'HOD Approved' || p.status === 'Completed').length,
      rejected: history.filter(p => p.status === 'Rejected').length
    };

    res.json({
      student,
      stats,
      history
    });
  } catch (err) {
    next(err);
  }
};
exports.getDepartmentStudents = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { include: "Staff" });
    if (!user.Staff) return res.status(403).json({ message: "HOD profile incomplete" });

    const students = await Student.findAll({
      where: { DepartmentDepartmentId: user.Staff.DepartmentDepartmentId },
      include: ["User"],
      order: [[{ model: User, as: "User" }, "name", "ASC"]]
    });

    const formatted = students.map(s => ({
      student_id: s.student_id,
      user_id: s.User.user_id,
      name: s.User.name,
      email: s.User.email,
      year: s.year,
      category: s.category,
      parent_phone: s.parent_phone,
      profile_pic: s.profile_pic,
      is_suspended: s.is_suspended,
      active: s.active
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

exports.suspendStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: "User" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Verify HOD department matches student department
    const hodUser = await User.findByPk(req.user.id, { include: "Staff" });
    if (student.DepartmentDepartmentId !== hodUser.Staff.DepartmentDepartmentId) {
      return res.status(403).json({ message: "You can only manage students in your department" });
    }

    student.is_suspended = !student.is_suspended;
    await student.save();

    await notifyUser(student.UserUserId,
      student.is_suspended
        ? "Access Suspended: You have been temporarily blocked from applying for gate passes."
        : "Access Restored: Your gate pass privileges have been restored.",
      { type: student.is_suspended ? "error" : "success" }
    );

    res.json({ message: `Student ${student.is_suspended ? "suspended" : "restored"} successfully`, is_suspended: student.is_suspended });
  } catch (err) {
    next(err);
  }
};

exports.bulkSuspend = async (req, res, next) => {
  try {
    const { action, studentIds } = req.body; // action: 'suspend' | 'restore'
    if (!["suspend", "restore"].includes(action)) return res.status(400).json({ message: "Invalid action" });

    const hodUser = await User.findByPk(req.user.id, { include: "Staff" });
    const deptId = hodUser.Staff.DepartmentDepartmentId;

    let whereClause = { DepartmentDepartmentId: deptId };

    // If specific IDs provided, filter by them (and verify dept)
    if (studentIds && studentIds.length > 0) {
      whereClause.student_id = studentIds;
    }

    const isSuspended = action === "suspend";
    await Student.update({ is_suspended: isSuspended }, { where: whereClause });

    res.json({ message: `Students ${isSuspended ? "suspended" : "restored"} successfully` });
  } catch (err) {
    next(err);
  }
};
