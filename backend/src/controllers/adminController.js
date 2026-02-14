const { User, Department, Staff, Student, GatePass, Notification } = require("../models");
const bcrypt = require("bcryptjs");
const { Sequelize, Op } = require("sequelize");
const fs = require('fs');
const csv = require('csv-parser');

/* ================= DEPARTMENTS ================= */

exports.createDepartment = async (req, res, next) => {
  try {
    if (!req.body.department_name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const dept = await Department.create({
      department_name: req.body.department_name
    });

    res.status(201).json({ message: "Department created", dept });
  } catch (err) {
    next(err);
  }
};

exports.getDepartments = async (req, res, next) => {
  try {
    const depts = await Department.findAll({ include: "Staffs" });
    res.json(depts);
  } catch (err) {
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    await dept.update({
      department_name: req.body.department_name || dept.department_name
    });

    res.json({ message: "Department updated", dept });
  } catch (err) {
    next(err);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    await dept.destroy();
    res.json({ message: "Department deleted" });
  } catch (err) {
    next(err);
  }
};

/* ================= STAFF ================= */

exports.uploadStaffCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a CSV file" });
    }

    const staffList = [];
    const errors = [];
    let successCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => staffList.push(data))
      .on('end', async () => {
        for (const row of staffList) {
          try {
            // Validate required fields
            if (!row.name || !row.email) {
              errors.push(`Row for ${row.name || 'Unknown'}: Missing name or email`);
              continue;
            }

            const roleName = row.role ? row.role.toLowerCase() : 'staff';
            const validRoles = ['staff', 'hod', 'warden', 'security'];
            if (!validRoles.includes(roleName)) {
              errors.push(`Row for ${row.name}: Invalid role '${roleName}'`);
              continue;
            }

            let departmentId = null;
            if (['staff', 'hod'].includes(roleName)) {
              if (!row.department_name) {
                errors.push(`Row for ${row.name}: Department required for ${roleName}`);
                continue;
              }
              const department = await Department.findOne({
                where: { department_name: row.department_name.trim() }
              });
              if (!department) {
                errors.push(`Row for ${row.name}: Department '${row.department_name}' not found`);
                continue;
              }
              departmentId = department.department_id;
            }

            // Check if user exists
            const existingUser = await User.findOne({ where: { email: row.email } });
            if (existingUser) {
              errors.push(`Row for ${row.name}: Email ${row.email} already exists`);
              continue;
            }

            // Create User and Staff
            const defaultPassword = process.env.DEFAULT_STAFF_PASSWORD || "staff123";
            const hashed = await bcrypt.hash(defaultPassword, 10);

            const user = await User.create({
              name: row.name,
              email: row.email,
              password: hashed,
              role: roleName,
              active: true,
              needs_password_change: true
            });

            const staffData = {
              UserUserId: user.user_id,
              role: roleName
            };
            if (departmentId) {
              staffData.DepartmentDepartmentId = departmentId;
            }

            await Staff.create(staffData);
            successCount++;
          } catch (err) {
            errors.push(`Row for ${row.name || 'Unknown'}: ${err.message}`);
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: "CSV processing completed",
          summary: {
            total: staffList.length,
            success: successCount,
            failed: errors.length,
            errors: errors
          }
        });
      });
  } catch (err) {
    next(err);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role, department_id } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    // Department is mandatory only for staff/hod
    if (["staff", "hod"].includes(role) && !department_id) {
      return res.status(400).json({ message: "Department is required for Staff/HOD" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      active: true
    });

    const staffData = {
      UserUserId: user.user_id,
      role
    };

    if (department_id) {
      staffData.DepartmentDepartmentId = department_id;
    }

    const staff = await Staff.create(staffData);

    res.status(201).json({
      message: "Staff created successfully",
      user,
      staff
    });
  } catch (err) {
    next(err);
  }
};

exports.getStaff = async (req, res, next) => {
  try {
    const staff = await User.findAll({
      where: { role: ["staff", "hod", "warden", "security"] },
      include: {
        association: "Staff",
        include: [
          { association: "Department" },
          { association: "AssignedStudents", attributes: ["student_id"] }
        ]
      }
    });

    res.json(staff);
  } catch (err) {
    next(err);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff not found" });
    }

    await user.update({
      name: req.body.name || user.name,
      email: req.body.email || user.email
    });

    if (req.body.role) {
      const staff = await Staff.findOne({ where: { UserUserId: user.user_id } });
      if (staff) {
        await staff.update({ role: req.body.role });
        user.role = req.body.role;
        await user.save();
      }
    }

    res.json({ message: "Staff updated", user });
  } catch (err) {
    next(err);
  }
};

exports.deactivateStaff = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Staff not found" });
    }

    user.active = false;
    await user.save();

    res.json({ message: "Staff deactivated", user });
  } catch (err) {
    next(err);
  }
};

/* ================= STUDENTS ================= */

exports.resetStaffPasswordFlag = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Staff not found" });
    }

    user.needs_password_change = true;
    user.password = await bcrypt.hash(process.env.DEFAULT_STAFF_PASSWORD || "staff123", 10);
    await user.save();

    res.json({ message: "Staff password reset to default and allowed to change on next login" });
  } catch (err) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    console.log("Create Student Payload:", req.body);
    console.log("Create Student File:", req.file);
    const { name, email, password, year, category, parent_phone, department_id } = req.body;

    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (!year) missingFields.push("year");
    if (!category) missingFields.push("category");
    if (!parent_phone) missingFields.push("parent_phone");
    if (!department_id) missingFields.push("department_id");

    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "student",
      active: true
    });

    const studentData = {
      year,
      category,
      parent_phone,
      UserUserId: user.user_id,
      DepartmentDepartmentId: department_id
    };

    if (req.file) {
      studentData.profile_pic = req.file.filename;
    }

    const student = await Student.create(studentData);

    res.status(201).json({
      message: "Student created successfully",
      user,
      student
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadStudentCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a CSV file" });
    }

    const students = [];
    const errors = [];
    let successCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => students.push(data))
      .on('end', async () => {
        for (const row of students) {
          try {
            // Validate required fields
            const requiredFields = ['name', 'email', 'year', 'category', 'parent_phone', 'department_name'];
            const missing = requiredFields.filter(field => !row[field]);

            if (missing.length > 0) {
              errors.push(`Row for ${row.name || 'Unknown'}: Missing ${missing.join(', ')}`);
              continue;
            }

            // Find department
            const department = await Department.findOne({
              where: { department_name: row.department_name.trim() }
            });

            if (!department) {
              errors.push(`Row for ${row.name}: Department '${row.department_name}' not found`);
              continue;
            }

            // Check if user exists
            const existingUser = await User.findOne({ where: { email: row.email } });
            if (existingUser) {
              errors.push(`Row for ${row.name}: Email ${row.email} already exists`);
              continue;
            }

            // Create User and Student
            const defaultPassword = process.env.DEFAULT_STUDENT_PASSWORD || "student123";
            const hashed = await bcrypt.hash(defaultPassword, 10);

            const user = await User.create({
              name: row.name,
              email: row.email,
              password: hashed,
              role: "student",
              active: true
            });

            await Student.create({
              year: parseInt(row.year),
              category: row.category,
              parent_phone: row.parent_phone,
              UserUserId: user.user_id,
              DepartmentDepartmentId: department.department_id
            });

            successCount++;
          } catch (err) {
            errors.push(`Row for ${row.name || 'Unknown'}: ${err.message}`);
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: "CSV processing completed",
          summary: {
            total: students.length,
            success: successCount,
            failed: errors.length,
            errors: errors
          }
        });
      });
  } catch (err) {
    next(err);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { department_id, year } = req.query;

    const where = { role: "student" };
    const studentWhere = {};

    if (department_id) studentWhere.DepartmentDepartmentId = department_id;
    if (year) studentWhere.year = year;

    const students = await User.findAll({
      where,
      include: {
        association: "Student",
        where: Object.keys(studentWhere).length ? studentWhere : undefined,
        include: {
          association: "Department"
        }
      }
    });

    res.json(students);
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    const student = await Student.findOne({ where: { UserUserId: user.user_id } });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    await user.update({
      name: req.body.name || user.name,
      email: req.body.email || user.email
    });

    const updateData = {
      year: req.body.year || student.year,
      category: req.body.category || student.category,
      parent_phone: req.body.parent_phone || student.parent_phone
    };

    if (req.file) {
      updateData.profile_pic = req.file.filename;
    }

    await student.update(updateData);

    res.json({ message: "Student updated", user, student });
  } catch (err) {
    next(err);
  }
};

exports.deactivateStudent = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }

    user.active = false;
    await user.save();

    res.json({ message: "Student deactivated", user });
  } catch (err) {
    next(err);
  }
};


exports.allowPasswordChange = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.needs_password_change = true;
    user.password = await bcrypt.hash(process.env.DEFAULT_STUDENT_PASSWORD || "student123", 10); // Reset to default too? Yes, usually implied.
    await user.save();

    res.json({ message: "User allowed to change password (reset to default)" });
  } catch (err) {
    next(err);
  }
};

/* ================= ANALYTICS ================= */

exports.analytics = async (req, res, next) => {
  try {
    const total = await GatePass.count();
    const approved = await GatePass.count({ where: { status: "HOD Approved" } });
    const rejected = await GatePass.count({ where: { status: "Rejected" } });
    const pending = await GatePass.count({
      where: {
        status: ["Pending", "Tutor Approved", "HOD Pending", "Warden Pending"]
      }
    });

    const totalStudents = await Student.count();
    const totalStaff = await User.count({ where: { role: ["staff", "hod"] } });

    // Get stats by department - Simplified
    const departments = await Department.findAll({
      include: { association: "Students", attributes: ["student_id"] }
    });

    const deptStats = departments.map(dept => ({
      department_name: dept.department_name,
      student_count: dept.Students.length
    }));

    // Common reasons - Simplified
    const allPasses = await GatePass.findAll({ attributes: ["reason"] });
    const reasonCounts = {};
    allPasses.forEach(p => {
      if (p.reason) {
        reasonCounts[p.reason] = (reasonCounts[p.reason] || 0) + 1;
      }
    });

    const commonReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      summary: {
        total,
        approved,
        rejected,
        pending,
        total_students: totalStudents,
        total_staff: totalStaff,
        approval_rate: total > 0 ? ((approved / total) * 100).toFixed(2) + "%" : "0%"
      },
      department_stats: deptStats,
      common_reasons: commonReasons
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    next(err);
  }
};

exports.assignHOD = async (req, res, next) => {
  try {
    const { staff_id, department_id } = req.body;

    const staff = await Staff.findByPk(staff_id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const user = await User.findByPk(staff.UserUserId);

    user.role = "hod";
    await user.save();

    staff.role = "hod";
    staff.DepartmentDepartmentId = department_id;
    await staff.save();

    res.json({ message: "Staff assigned as HOD", staff, user });
  } catch (err) {
    next(err);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);

    const thisMonth = new Date(today);
    thisMonth.setMonth(today.getMonth() - 1);

    const todayPasses = await GatePass.count({
      where: {
        createdAt: { [Op.gte]: today }
      }
    });

    const weekPasses = await GatePass.count({
      where: {
        createdAt: { [Op.gte]: thisWeek }
      }
    });

    const monthPasses = await GatePass.count({
      where: {
        createdAt: { [Op.gte]: thisMonth }
      }
    });

    // Weekly breakdowns
    const weeklyApproved = await GatePass.count({
      where: {
        createdAt: { [Op.gte]: thisWeek },
        status: ["Approved", "HOD Approved"]
      }
    });

    const weeklyRejected = await GatePass.count({
      where: {
        createdAt: { [Op.gte]: thisWeek },
        status: "Rejected"
      }
    });

    const weeklyPending = await GatePass.count({
      where: {
        createdAt: { [Op.gte]: thisWeek },
        status: { [Op.notIn]: ["Approved", "HOD Approved", "Rejected", "Cancelled"] }
      }
    });

    res.json({
      passes_today: todayPasses,
      passes_this_week: weekPasses,
      passes_this_month: monthPasses,
      weekly_approved: weeklyApproved,
      weekly_rejected: weeklyRejected,
      weekly_pending: weeklyPending,
      total_users: await User.count(),
      active_users: await User.count({ where: { active: true } })
    });
  } catch (err) {
    next(err);
  }
};

exports.getDailyStats = async (req, res, next) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);

    const passes = await GatePass.findAll({
      where: {
        createdAt: { [Op.gte]: lastWeek }
      },
      attributes: ["createdAt"]
    });

    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lastWeek);
      d.setDate(lastWeek.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      chartData.push({ name: dayName, count: 0, fullDate: d.toDateString() });
    }

    passes.forEach(pass => {
      const d = new Date(pass.createdAt);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      // Simple match by name might be ambiguous if spanning > 1 week, but logic limits to last 7 days.
      // Better to match by date string to be safe against same day-of-week.
      const dateStr = d.toDateString();

      const dayStat = chartData.find(stat => stat.fullDate === dateStr);
      if (dayStat) {
        dayStat.count++;
      }
    });

    // Remove fullDate before sending if not needed, or keep it.
    const finalData = chartData.map(({ name, count }) => ({ name, count }));

    res.json(finalData);
  } catch (err) {
    console.error("Daily Stats Error:", err);
    next(err);
  }
};

exports.getLiveStatus = async (req, res, next) => {
  try {
    // Total Active Students
    const totalStudents = await Student.count({ where: { active: true } });

    // Students currently marked OUT (actual_out exists, actual_in IS NULL)
    const outsideLogs = await SecurityLog.findAll({
      where: {
        actual_out: { [Op.ne]: null },
        actual_in: null
      },
      include: [
        {
          model: GatePass,
          include: [
            {
              model: Student,
              include: ["Department"]
            }
          ]
        }
      ]
    });

    const studentsOutsideCount = outsideLogs.length;
    const studentsInsideCount = totalStudents - studentsOutsideCount;

    // Hostellers Outside
    const hostellersOutsideCount = outsideLogs.filter(log =>
      log.GatePass && log.GatePass.Student && log.GatePass.Student.category === "Hosteller"
    ).length;

    // Late Returns
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const lateCount = outsideLogs.filter(log => {
      const outTime = new Date(log.actual_out);
      const expectedStr = log.GatePass?.expected_return;

      if (outTime < todayStart) return true; // Out before today

      if (expectedStr) {
        const [hours, minutes] = expectedStr.split(':');
        const expectedDate = new Date();
        expectedDate.setHours(parseInt(hours), parseInt(minutes), 0);

        return now > expectedDate;
      }
      return false;
    }).length;

    res.json({
      students_inside: studentsInsideCount,
      students_outside: studentsOutsideCount,
      hostellers_outside: hostellersOutsideCount,
      late_returns: lateCount,
      timestamp: new Date()
    });


  } catch (err) {
    console.error("Live Status Error:", err);
    next(err);
  }
};


exports.getAdvancedStats = async (req, res, next) => {
  try {
    const { startDate, endDate, departmentId, category } = req.query;

    const where = {};

    // Date Range Filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    // Include Filters
    const studentWhere = {};
    if (departmentId && departmentId !== "all") studentWhere.DepartmentDepartmentId = departmentId;
    if (category && category !== "all") studentWhere.category = category;

    const passes = await GatePass.findAll({
      where,
      include: [
        {
          model: Student,
          where: Object.keys(studentWhere).length ? studentWhere : undefined,
          include: ["Department"]
        }
      ],
      order: [["createdAt", "ASC"]]
    });

    // Calculate Summary
    const summary = {
      total: passes.length,
      approved: passes.filter(p => p.status === "HOD Approved" || p.status === "Approved").length,
      rejected: passes.filter(p => p.status === "Rejected").length,
      pending: passes.filter(p => ["Pending", "Tutor Approved", "HOD Pending", "Warden Pending"].includes(p.status)).length
    };

    // Calculate Trends (Daily Count)
    const trendMap = {};
    passes.forEach(p => {
      const date = new Date(p.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD
      trendMap[date] = (trendMap[date] || 0) + 1;
    });

    // Fill in gaps if range provided? (Optional, skipping for now to keep it simple)
    const trends = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    // Calculate Department Breakdown (from filtered results)
    const deptMap = {};
    passes.forEach(p => {
      const deptName = p.Student?.Department?.department_name || "Unknown";
      deptMap[deptName] = (deptMap[deptName] || 0) + 1;
    });

    const departmentBreakdown = Object.entries(deptMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Calculate Status Distribution for Pie Chart
    const breakdown = {
      Approved: summary.approved,
      Rejected: summary.rejected,
      Pending: summary.pending,
      Cancelled: passes.filter(p => p.status === "Cancelled").length
    };

    const distribution = Object.entries(breakdown)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    res.json({
      summary,
      trends,
      department_breakdown: departmentBreakdown,
      distribution
    });
  } catch (err) {
    console.error("Advanced Stats Error:", err);
    next(err);
  }
};
