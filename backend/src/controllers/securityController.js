const { Op } = require("sequelize");
const { SecurityLog, GatePass, Student, User, Department, Staff } = require("../models");
const { notifyUser, notifyParent, notifyHOD } = require("../services/notificationService");
const { isHosteller, isDayScholar } = require("../utils/studentCategory");

const ACTIVE_STATUS = ["HOD Approved", "Warden Approved", "Day Scholar Out"];
const ACTIONABLE_STATUS = ["HOD Approved", "Warden Approved", "Late Return"];
const EXPIRABLE_DAY_SCHOLAR_STATUS = ["HOD Approved", "Warden Approved", "Day Scholar Out"];
const LATE_STATUS = ["Late Return", "Late In Grace", "Late In Violation"];
const HISTORY_STATUS = ["Completed", "Late In Grace", "Late In Violation"];

const getDateAtTime = (sourceDate, hour, minute) => {
  const result = new Date(sourceDate);
  result.setHours(hour, minute, 0, 0);
  return result;
};

const parseExpectedReturn = (timeString, baseDate = new Date()) => {
  if (!timeString || typeof timeString !== "string") return null;
  const [hours, minutes] = timeString.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const expectedDate = new Date(baseDate);
  expectedDate.setHours(hours, minutes, 0, 0);
  return expectedDate;
};

const getIncludeConfig = (search) => {
  const studentInclude = {
    model: Student,
    include: [
      { model: User, as: "User" },
      { model: Department, as: "Department" },
      {
        model: Staff,
        as: "AssignedStaff",
        include: [{ model: User, as: "User" }]
      }
    ]
  };

  if (search) {
    studentInclude.where = {
      [Op.or]: [
        { roll_no: { [Op.like]: `%${search}%` } },
        { "$User.name$": { [Op.like]: `%${search}%` } }
      ]
    };
  }

  return [studentInclude, { model: SecurityLog }];
};

const refreshGatePassStatuses = async () => {
  const now = new Date();
  const todayStart = getDateAtTime(now, 0, 0);
  const dayScholarCutoff = getDateAtTime(now, 17, 30);

  const candidates = await GatePass.findAll({
    where: {
      status: {
        [Op.in]: [...ACTIVE_STATUS, ...LATE_STATUS]
      }
    },
    include: [{ model: Student }, { model: SecurityLog }]
  });

  for (const pass of candidates) {
    const category = pass.Student?.category;

    if (isDayScholar(category) && EXPIRABLE_DAY_SCHOLAR_STATUS.includes(pass.status)) {
      const passDayStart = getDateAtTime(pass.createdAt || now, 0, 0);
      if (passDayStart < todayStart || now >= dayScholarCutoff) {
        pass.status = "Expired";
        await pass.save();
      }
      continue;
    }

    if (isHosteller(category) && pass.SecurityLog?.actual_out && !pass.SecurityLog?.actual_in) {
      const expectedAt = parseExpectedReturn(pass.expected_return, pass.createdAt || now);
      if (!expectedAt) continue;

      const graceDeadline = new Date(expectedAt.getTime() + 15 * 60 * 1000);
      if (now > graceDeadline && pass.status !== "Late Return") {
        pass.status = "Late Return";
        await pass.save();
      }
    }
  }
};

exports.getApprovedPasses = async (req, res, next) => {
  try {
    const { search } = req.query;
    await refreshGatePassStatuses();

    const passes = await GatePass.findAll({
      where: {
        status: {
          [Op.in]: ACTIONABLE_STATUS
        }
      },
      include: getIncludeConfig(search),
      order: [["createdAt", "DESC"]]
    });

    res.json(passes);
  } catch (err) {
    next(err);
  }
};

exports.getDashboardPasses = async (req, res, next) => {
  try {
    await refreshGatePassStatuses();
    const include = getIncludeConfig();

    const [active, expired, late] = await Promise.all([
      GatePass.findAll({
        where: { status: { [Op.in]: ACTIVE_STATUS } },
        include,
        order: [["updatedAt", "DESC"]]
      }),
      GatePass.findAll({
        where: { status: "Expired" },
        include,
        order: [["updatedAt", "DESC"]],
        limit: 200
      }),
      GatePass.findAll({
        where: { status: { [Op.in]: LATE_STATUS } },
        include,
        order: [["updatedAt", "DESC"]],
        limit: 200
      })
    ]);

    res.json({ active, expired, late });
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
                { model: User, as: "User" },
                { model: Department, as: "Department" }
              ]
            }
          ]
        },
        { model: User, as: "CheckedOutBy" },
        { model: User, as: "CheckedInBy" }
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
    await refreshGatePassStatuses();

    const pass = await GatePass.findByPk(gatepass_id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    if (!["HOD Approved", "Warden Approved"].includes(pass.status)) {
      return res.status(400).json({ message: "Only approved passes can be marked OUT" });
    }

    let log = await SecurityLog.findOne({ where: { GatePassGatepassId: gatepass_id } });

    if (!log) {
      log = await SecurityLog.create({
        GatePassGatepassId: gatepass_id,
        actual_out: new Date(),
        checked_out_by: req.user.id
      });
    } else if (!log.actual_out) {
      log.actual_out = new Date();
      log.checked_out_by = req.user.id;
      await log.save();
    }

    if (isDayScholar(pass.Student?.category)) {
      pass.status = "Day Scholar Out";
      await pass.save();
    }

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
    await refreshGatePassStatuses();

    const pass = await GatePass.findByPk(gatepass_id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    // Day scholars CAN be marked IN only before the 5:30 PM cutoff.
    // After 5:30 PM the pass auto-expires — no IN marking needed.
    if (isDayScholar(pass.Student?.category)) {
      const now = new Date();
      const dayScholarCutoff = getDateAtTime(now, 17, 30); // 5:30 PM

      if (now >= dayScholarCutoff) {
        return res.status(400).json({
          message: "Day scholar's pass has already expired (after 5:30 PM). No IN marking required."
        });
      }
      // Before 5:30 PM — allow IN marking and complete the pass below
    }

    const log = await SecurityLog.findOne({ where: { GatePassGatepassId: gatepass_id } });

    if (!log) {
      return res.status(400).json({ message: "Student must be marked OUT first" });
    }

    const now = new Date();
    log.actual_in = now;
    log.checked_in_by = req.user.id;
    await log.save();

    const expectedAt = parseExpectedReturn(pass.expected_return, pass.createdAt || now);
    if (!expectedAt) {
      pass.status = "Completed";
    } else {
      const graceDeadline = new Date(expectedAt.getTime() + 15 * 60 * 1000);
      if (now > graceDeadline) {
        pass.status = "Late In Violation";
      } else if (now > expectedAt) {
        pass.status = "Late In Grace";
      } else {
        pass.status = "Completed";
      }
    }
    await pass.save();

    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, "You have been marked IN to campus", {
      type: "alert",
      reference_id: gatepass_id
    });

    await notifyParent(pass.StudentStudentId, `Your ward returned to campus at ${new Date().toLocaleTimeString()}`, {
      reference_id: gatepass_id
    });

    await notifyHOD(student.DepartmentDepartmentId, `${student.User.name} has returned from approved gate pass`, {
      reference_id: gatepass_id
    });

    res.json({ message: "Student marked IN", log, status: pass.status });
  } catch (err) {
    next(err);
  }
};

exports.getCompletedPasses = async (req, res, next) => {
  try {
    const passes = await GatePass.findAll({
      where: { status: { [Op.in]: HISTORY_STATUS } },
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
        }
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
      where: { createdAt: { [Op.gte]: new Date(today) } }
    });

    const marked_out = logsToday.filter((l) => l.actual_out).length;
    const marked_in = logsToday.filter((l) => l.actual_in).length;

    res.json({
      total_checked_out: marked_out,
      total_checked_in: marked_in,
      currently_outside: marked_out - marked_in
    });
  } catch (err) {
    next(err);
  }
};
