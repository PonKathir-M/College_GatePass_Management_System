const { GatePass, Student, User, SecurityLog } = require("../models");
const { PASS_STATUS } = require("../config/constants");
const { notifyUser, notifyParent, notifySecurityGuard } = require("../services/notificationService");
const moment = require("moment");
const { Op } = require("sequelize");

const RANGE_DAYS_MAP = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365
};

const getDateBoundsFromQuery = (query = {}) => {
  const { range = "7d", startDate, endDate } = query;
  const now = moment();

  let startMoment = null;
  let endMoment = now.clone().endOf("day");

  if (range === "custom") {
    if (startDate) startMoment = moment(startDate).startOf("day");
    if (endDate) endMoment = moment(endDate).endOf("day");
  } else if (RANGE_DAYS_MAP[range]) {
    startMoment = now.clone().subtract(RANGE_DAYS_MAP[range] - 1, "days").startOf("day");
  } else if (range === "all") {
    startMoment = null;
  }

  const createdAt = {};
  if (startMoment?.isValid()) createdAt[Op.gte] = startMoment.toDate();
  if (endMoment?.isValid()) createdAt[Op.lte] = endMoment.toDate();

  return {
    range,
    startMoment,
    endMoment,
    whereClause: Object.keys(createdAt).length ? { createdAt } : {}
  };
};

const getDurationMinutes = (outTime, expectedReturn) => {
  if (!outTime || !expectedReturn) return 0;
  const out = moment(outTime, "HH:mm:ss");
  let ret = moment(expectedReturn, "HH:mm:ss");
  if (!out.isValid() || !ret.isValid()) return 0;
  if (ret.isBefore(out)) ret = ret.add(1, "day");
  return Math.max(0, ret.diff(out, "minutes"));
};

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
    const hodUser = await User.findByPk(req.user.id, { include: "Staff" });
    if (!hodUser?.Staff?.DepartmentDepartmentId) {
      return res.status(403).json({ message: "HOD profile incomplete" });
    }

    const deptId = hodUser.Staff.DepartmentDepartmentId;
    const { range, startMoment, endMoment, whereClause } = getDateBoundsFromQuery(req.query);

    const passes = await GatePass.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          where: { DepartmentDepartmentId: deptId },
          attributes: ["student_id", "DepartmentDepartmentId"]
        }
      ]
    });

    const total = passes.length;
    const approved = passes.filter(p => p.status === "HOD Approved" || p.status === "Completed").length;
    const rejected = passes.filter(p => p.status === "Rejected").length;
    const pending = passes.filter(p => ["Pending", "Tutor Approved", "HOD Pending"].includes(p.status)).length;

    const countByDate = {};
    passes.forEach((pass) => {
      const dateKey = moment(pass.createdAt).format("YYYY-MM-DD");
      countByDate[dateKey] = (countByDate[dateKey] || 0) + 1;
    });

    let chartData = [];

    // For manageable ranges, fill missing days to show a proper timeline.
    const canGenerateContinuous =
      startMoment?.isValid() &&
      endMoment?.isValid() &&
      endMoment.diff(startMoment, "days") <= 120;

    if (canGenerateContinuous) {
      const days = endMoment.diff(startMoment, "days");
      for (let i = 0; i <= days; i++) {
        const dateStr = startMoment.clone().add(i, "days").format("YYYY-MM-DD");
        chartData.push({
          date: moment(dateStr).format("MMM DD"),
          count: countByDate[dateStr] || 0
        });
      }
    } else {
      chartData = Object.entries(countByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateStr, count]) => ({
          date: moment(dateStr).format("MMM DD"),
          count
        }));
    }

    res.json({
      total,
      approved,
      rejected,
      pending,
      chartData,
      filters: {
        department_id: deptId,
        range,
        start_date: startMoment?.isValid() ? startMoment.format("YYYY-MM-DD") : null,
        end_date: endMoment?.isValid() ? endMoment.format("YYYY-MM-DD") : null
      }
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
      student_mobile_number: s.student_mobile_number,
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

exports.getDepartmentStudentsWithHistory = async (req, res, next) => {
  try {
    const { year = "all", search = "" } = req.query;

    const hodUser = await User.findByPk(req.user.id, { include: "Staff" });
    if (!hodUser?.Staff?.DepartmentDepartmentId) {
      return res.status(403).json({ message: "HOD profile incomplete" });
    }

    const deptId = hodUser.Staff.DepartmentDepartmentId;
    const studentWhere = { DepartmentDepartmentId: deptId };
    if (year !== "all" && !Number.isNaN(Number(year))) {
      studentWhere.year = Number(year);
    }

    const students = await Student.findAll({
      where: studentWhere,
      include: [
        { association: "User", attributes: ["user_id", "name", "email"] },
        {
          association: "AssignedStaff",
          attributes: ["staff_id"],
          include: [{ association: "User", attributes: ["user_id", "name", "email"] }],
          required: false
        }
      ],
      order: [["year", "ASC"], ["student_id", "ASC"]]
    });

    const studentIds = students.map((s) => s.student_id);
    const allPasses = studentIds.length
      ? await GatePass.findAll({
        where: { StudentStudentId: studentIds },
        attributes: ["gatepass_id", "StudentStudentId", "status", "createdAt", "out_time", "expected_return"]
      })
      : [];

    const passStatsMap = {};
    allPasses.forEach((pass) => {
      const sid = pass.StudentStudentId;
      if (!passStatsMap[sid]) {
        passStatsMap[sid] = {
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          longestMinutes: 0,
          lastAppliedAt: null
        };
      }

      const stats = passStatsMap[sid];
      stats.total += 1;
      if (pass.status === "HOD Approved" || pass.status === "Completed") stats.approved += 1;
      else if (pass.status === "Rejected") stats.rejected += 1;
      else stats.pending += 1;

      const durationMinutes = getDurationMinutes(pass.out_time, pass.expected_return);
      if (durationMinutes > stats.longestMinutes) stats.longestMinutes = durationMinutes;

      if (!stats.lastAppliedAt || moment(pass.createdAt).isAfter(stats.lastAppliedAt)) {
        stats.lastAppliedAt = pass.createdAt;
      }
    });

    const searchText = search.trim().toLowerCase();

    const rows = students
      .map((student) => {
        const stats = passStatsMap[student.student_id] || {
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          longestMinutes: 0,
          lastAppliedAt: null
        };

        return {
          student_id: student.student_id,
          year: student.year,
          category: student.category,
          parent_phone: student.parent_phone,
          student_mobile_number: student.student_mobile_number,
          profile_pic: student.profile_pic,
          name: student.User?.name || "Unknown",
          email: student.User?.email || "-",
          tutor_name: student.AssignedStaff?.User?.name || "Not Assigned",
          pass_stats: {
            ...stats,
            longestHours: Number((stats.longestMinutes / 60).toFixed(2)),
            lastAppliedAt: stats.lastAppliedAt
          }
        };
      })
      .filter((row) => {
        if (!searchText) return true;
        return (
          row.name.toLowerCase().includes(searchText) ||
          row.email.toLowerCase().includes(searchText) ||
          String(row.student_id).includes(searchText) ||
          row.tutor_name.toLowerCase().includes(searchText)
        );
      });

    const uniqueYears = [...new Set(students.map((s) => s.year).filter((y) => y !== null && y !== undefined))]
      .sort((a, b) => a - b);

    res.json({
      department_id: deptId,
      filters: { year, search },
      years: uniqueYears,
      total_students: rows.length,
      students: rows
    });
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentInsights = async (req, res, next) => {
  try {
    const hodUser = await User.findByPk(req.user.id, { include: "Staff" });
    if (!hodUser?.Staff?.DepartmentDepartmentId) {
      return res.status(403).json({ message: "HOD profile incomplete" });
    }

    const deptId = hodUser.Staff.DepartmentDepartmentId;
    const { range, startMoment, endMoment, whereClause } = getDateBoundsFromQuery(req.query);

    const passes = await GatePass.findAll({
      where: whereClause,
      include: [
        {
          association: "Student",
          where: { DepartmentDepartmentId: deptId },
          include: [
            { association: "User", attributes: ["user_id", "name", "email"] },
            {
              association: "AssignedStaff",
              include: [{ association: "User", attributes: ["user_id", "name", "email"] }],
              required: false
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    const yearStatsMap = {};
    const studentStatsMap = {};
    const tutorStatsMap = {};
    let hostellerRequests = 0;
    let dayScholarRequests = 0;
    let longestPass = null;
    let longestPasses = [];

    passes.forEach((pass) => {
      const student = pass.Student;
      const yearKey = String(student?.year ?? "Unknown");
      const studentId = student?.student_id;
      const studentName = student?.User?.name || `Student ${studentId}`;
      const tutorName = student?.AssignedStaff?.User?.name || "Not Assigned";
      const category = String(student?.category || "").toLowerCase();
      if (category.includes("hostel")) hostellerRequests += 1;
      else dayScholarRequests += 1;

      if (!yearStatsMap[yearKey]) yearStatsMap[yearKey] = { year: yearKey, total: 0, approved: 0, rejected: 0, pending: 0 };
      if (!studentStatsMap[studentId]) {
        studentStatsMap[studentId] = {
          student_id: studentId,
          name: studentName,
          email: student?.User?.email || "-",
          year: student?.year,
          tutor_name: tutorName,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          profile_pic: student?.profile_pic || null,
          max_duration_minutes: 0
        };
      }
      if (!tutorStatsMap[tutorName]) tutorStatsMap[tutorName] = { tutor_name: tutorName, total: 0, approved: 0, rejected: 0, pending: 0 };

      yearStatsMap[yearKey].total += 1;
      studentStatsMap[studentId].total += 1;
      tutorStatsMap[tutorName].total += 1;

      const isApproved = pass.status === "HOD Approved" || pass.status === "Completed";
      const isRejected = pass.status === "Rejected";

      if (isApproved) {
        yearStatsMap[yearKey].approved += 1;
        studentStatsMap[studentId].approved += 1;
        tutorStatsMap[tutorName].approved += 1;
      } else if (isRejected) {
        yearStatsMap[yearKey].rejected += 1;
        studentStatsMap[studentId].rejected += 1;
        tutorStatsMap[tutorName].rejected += 1;
      } else {
        yearStatsMap[yearKey].pending += 1;
        studentStatsMap[studentId].pending += 1;
        tutorStatsMap[tutorName].pending += 1;
      }

      const durationMinutes = getDurationMinutes(pass.out_time, pass.expected_return);
      if (durationMinutes > studentStatsMap[studentId].max_duration_minutes) {
        studentStatsMap[studentId].max_duration_minutes = durationMinutes;
      }
      if (!longestPass || durationMinutes > longestPass.duration_minutes) {
        longestPass = {
          gatepass_id: pass.gatepass_id,
          student_id: studentId,
          student_name: studentName,
          reason: pass.reason,
          out_time: pass.out_time,
          expected_return: pass.expected_return,
          duration_minutes: durationMinutes,
          duration_hours: Number((durationMinutes / 60).toFixed(2)),
          createdAt: pass.createdAt
        };
        longestPasses = [longestPass];
      } else if (longestPass && durationMinutes === longestPass.duration_minutes) {
        longestPasses.push({
          gatepass_id: pass.gatepass_id,
          student_id: studentId,
          student_name: studentName,
          reason: pass.reason,
          out_time: pass.out_time,
          expected_return: pass.expected_return,
          duration_minutes: durationMinutes,
          duration_hours: Number((durationMinutes / 60).toFixed(2)),
          createdAt: pass.createdAt
        });
      }
    });

    const yearStats = Object.values(yearStatsMap).sort((a, b) => b.total - a.total);
    const allStudentsRanked = Object.values(studentStatsMap).sort((a, b) => b.total - a.total);
    const topStudents = allStudentsRanked.slice(0, 10);
    const tutorBreakdown = Object.values(tutorStatsMap).sort((a, b) => b.total - a.total);
    const topYear = yearStats[0] || null;
    const topStudent = topStudents[0] || null;
    const topTutor = tutorBreakdown[0] || null;

    const topYearTied = topYear ? yearStats.filter((item) => item.total === topYear.total) : [];
    const topStudentsTied = topStudent ? allStudentsRanked.filter((item) => item.total === topStudent.total) : [];
    const topTutorsTied = topTutor ? tutorBreakdown.filter((item) => item.total === topTutor.total) : [];

    const maxStudentDuration = allStudentsRanked.length
      ? Math.max(...allStudentsRanked.map((item) => item.max_duration_minutes || 0))
      : 0;

    const longestStudentTies = allStudentsRanked
      .filter((item) => (item.max_duration_minutes || 0) === maxStudentDuration && maxStudentDuration > 0)
      .map((item) => ({
        student_id: item.student_id,
        student_name: item.name,
        year: item.year,
        tutor_name: item.tutor_name,
        duration_minutes: item.max_duration_minutes,
        duration_hours: Number((item.max_duration_minutes / 60).toFixed(2))
      }));

    const longestStudentTop = longestStudentTies[0] || longestPass;

    const tutorApprovals = passes.filter((pass) => pass.status !== "Pending").length;
    const wardenApprovals = passes.filter((pass) => String(pass.Student?.category || "").toLowerCase().includes("hostel")).length;

    res.json({
      filters: {
        department_id: deptId,
        range,
        start_date: startMoment?.isValid() ? startMoment.format("YYYY-MM-DD") : null,
        end_date: endMoment?.isValid() ? endMoment.format("YYYY-MM-DD") : null
      },
      totals: {
        total_requests: passes.length,
        unique_students: Object.keys(studentStatsMap).length,
        top_year: topYear,
        top_year_tied: topYearTied,
        top_student: topStudent,
        top_students_tied: topStudentsTied,
        longest_pass: longestStudentTop,
        longest_passes_tied: longestStudentTies.length ? longestStudentTies : longestPasses,
        top_tutor: topTutor,
        top_tutors_tied: topTutorsTied,
        tutor_approvals: tutorApprovals,
        warden_approvals: wardenApprovals,
        hosteller_requests: hostellerRequests,
        day_scholar_requests: dayScholarRequests
      },
      year_stats: yearStats,
      top_students: topStudents,
      tutor_breakdown: tutorBreakdown
    });
  } catch (err) {
    next(err);
  }
};
