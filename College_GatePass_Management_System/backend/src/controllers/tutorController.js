const { GatePass, TutorApproval, Student, User, Staff } = require("../models");
const { PASS_STATUS } = require("../config/constants");
const { notifyUser, notifyParent, notifyHOD } = require("../services/notificationService");

// Get current user's staff profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        association: "Staff",
        include: {
          association: "Department",
          attributes: ["department_id", "department_name"]
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      Staff: user.Staff
    });
  } catch (err) {
    console.error("Error in getProfile:", err);
    next(err);
  }
};

exports.pendingRequests = async (req, res, next) => {
  try {
    const { Op } = require("sequelize");

    const user = await User.findByPk(req.user.id, {
      include: { association: "Staff" }
    });

    if (!user || !user.Staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Get all students under this tutor's department
    const students = await Student.findAll({
      where: { DepartmentDepartmentId: user.Staff.DepartmentDepartmentId }
    });

    const studentIds = students.map(s => s.student_id);

    // If no students in this department, return empty list early
    if (!studentIds.length) {
      return res.json([]);
    }

    // Use association names to avoid model/include mismatches
    const passes = await GatePass.findAll({
      where: {
        status: PASS_STATUS.PENDING,
        StudentStudentId: { [Op.in]: studentIds }
      },
      include: [
        {
          association: "Student",
          include: { association: "User" }
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(passes);
  } catch (err) {
    console.error("Error in pendingRequests:", err);
    next(err);
  }
};

exports.approve = async (req, res, next) => {
  try {
    const pass = await GatePass.findByPk(req.params.id, { include: "Student" });

    if (!pass) {
      return res.status(404).json({ message: "Gate pass not found" });
    }

    pass.status = "Tutor Approved";
    await pass.save();

    // Fetch staff details for the current user
    const user = await User.findByPk(req.user.id, { include: "Staff" });
    if (!user || !user.Staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    await TutorApproval.create({
      approved: true,
      GatePassGatepassId: pass.gatepass_id,
      StaffStaffId: user.Staff.staff_id
    });

    // Notify student
    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, "Your gate pass has been approved by your tutor", {
      type: "success",
      reference_id: pass.gatepass_id
    });

    // Notify parent
    await notifyParent(pass.StudentStudentId, "Your ward's gate pass has been approved by tutor", {
      reference_id: pass.gatepass_id
    });

    // Notify HOD
    await notifyHOD(student.DepartmentDepartmentId, `Gate pass ${pass.gatepass_id} needs your final approval`, {
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

    pass.status = PASS_STATUS.REJECTED;
    pass.rejection_reason = req.body.reason;
    await pass.save();

    // Fetch staff details for the current user
    const user = await User.findByPk(req.user.id, { include: "Staff" });
    if (!user || !user.Staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    await TutorApproval.create({
      approved: false,
      reason: req.body.reason,
      GatePassGatepassId: pass.gatepass_id,
      StaffStaffId: user.Staff.staff_id
    });

    // Notify student
    const student = await Student.findByPk(pass.StudentStudentId, { include: "User" });
    await notifyUser(student.User.user_id, `Gate pass rejected. Reason: ${req.body.reason}`, {
      type: "error",
      reference_id: pass.gatepass_id
    });

    // Notify parent
    await notifyParent(pass.StudentStudentId, `Gate pass request rejected. Reason: ${req.body.reason}`, {
      reference_id: pass.gatepass_id
    });

    res.json({ message: "Gate pass rejected", pass });
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentStudents = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        association: "Staff"
      }
    });

    if (!user || !user.Staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const students = await Student.findAll({
      where: { DepartmentDepartmentId: user.Staff.DepartmentDepartmentId },
      include: [
        { association: "User" },
        {
          association: "AssignedStaff",
          include: { association: "User" },
          required: false
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(students);
  } catch (err) {
    console.error("Error in getDepartmentStudents:", err);
    next(err);
  }
};

// Assign student to tutor
exports.assignStudent = async (req, res, next) => {
  try {
    const { student_id } = req.params;
    const user = await User.findByPk(req.user.id, { include: "Staff" });

    if (!user || !user.Staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const student = await Student.findByPk(student_id, {
      include: [
        { association: "User" },
        { association: "Department" },
        {
          association: "AssignedStaff",
          include: { association: "User" },
          required: false
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student belongs to same department
    if (student.DepartmentDepartmentId !== user.Staff.DepartmentDepartmentId) {
      return res.status(403).json({ message: "Student does not belong to your department" });
    }

    // Check if already assigned to another staff
    if (student.AssignedStaffStaffId && student.AssignedStaffStaffId !== user.Staff.staff_id) {
      return res.status(409).json({
        message: `Student is already assigned to ${student.AssignedStaff.User.name}`,
        assignedTo: student.AssignedStaff.User.name
      });
    }

    // Assign student to this tutor
    student.AssignedStaffStaffId = user.Staff.staff_id;
    await student.save();

    // Notify student
    await notifyUser(student.User.user_id, `You have been assigned to ${user.name} as your tutor`, {
      type: "info",
      reference_id: student.student_id
    });

    res.json({
      message: "Student assigned successfully",
      student: {
        student_id: student.student_id,
        name: student.User.name,
        year: student.year,
        assignedTo: user.name
      }
    });
  } catch (err) {
    console.error("Error in assignStudent:", err);
    next(err);
  }
};

// Unassign student from tutor
exports.unassignStudent = async (req, res, next) => {
  try {
    const { student_id } = req.params;
    const user = await User.findByPk(req.user.id, { include: "Staff" });

    if (!user || !user.Staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    const student = await Student.findByPk(student_id, {
      include: { model: User }
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if assigned to this staff
    if (student.AssignedStaffStaffId !== user.Staff.staff_id) {
      return res.status(403).json({ message: "You cannot unassign this student" });
    }

    student.AssignedStaffStaffId = null;
    await student.save();

    // Notify student
    await notifyUser(student.User.user_id, `You have been unassigned from ${user.name}`, {
      type: "info",
      reference_id: student.student_id
    });

    res.json({ message: "Student unassigned successfully", student });
  } catch (err) {
    console.error("Error in unassignStudent:", err);
    next(err);
  }
};

exports.getApprovalHistory = async (req, res, next) => {
  try {
    const approvals = await TutorApproval.findAll({
      include: "GatePass",
      order: [["createdAt", "DESC"]],
      limit: 50
    });

    res.json(approvals);
  } catch (err) {
    next(err);
  }
};

// Get students assigned to this staff member
exports.getAssignedStudents = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        association: "Staff"
      }
    });

    if (!user || !user.Staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    // Get only students assigned to this staff member
    const students = await Student.findAll({
      where: { AssignedStaffStaffId: user.Staff.staff_id },
      include: [
        { model: User },
        {
          model: Staff,
          as: "AssignedStaff",
          include: { model: User },
          required: false
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json({
      message: "Assigned students retrieved successfully",
      count: students.length,
      students: students.map(s => ({
        student_id: s.student_id,
        name: s.User.name,
        email: s.User.email,
        year: s.year,
        category: s.category,
        parent_phone: s.parent_phone,
        student_mobile_number: s.student_mobile_number,
        department_id: s.DepartmentDepartmentId,
        assigned_to: user.name
      }))
    });
  } catch (err) {
    console.error("Error in getAssignedStudents:", err);
    next(err);
  }
};

exports.bulkApprove = async (req, res, next) => {
  try {
    const { passIds } = req.body;
    if (!passIds || !passIds.length) return res.status(400).json({ message: "No requests selected" });

    const user = await User.findByPk(req.user.id, { include: "Staff" });
    if (!user || !user.Staff) return res.status(404).json({ message: "Staff profile not found" });

    const passes = await GatePass.findAll({
      where: { gatepass_id: passIds },
      include: [{ association: "Student", include: "User" }]
    });

    for (const pass of passes) {
      if (pass.status === PASS_STATUS.PENDING) {
        pass.status = "Tutor Approved";
        await pass.save();
        await TutorApproval.create({
          approved: true,
          GatePassGatepassId: pass.gatepass_id,
          StaffStaffId: user.Staff.staff_id
        });

        if (pass.Student && pass.Student.User) {
           await notifyUser(pass.Student.User.user_id, "Your gate pass has been approved by your tutor", { type: "success", reference_id: pass.gatepass_id });
           await notifyParent(pass.Student.student_id, "Your ward's gate pass has been approved by tutor", { reference_id: pass.gatepass_id });
           await notifyHOD(pass.Student.DepartmentDepartmentId, `Gate pass ${pass.gatepass_id} needs your final approval`, { reference_id: pass.gatepass_id });
        }
      }
    }
    res.json({ message: `Approved ${passIds.length} passes successfully` });
  } catch (err) {
    next(err);
  }
};

exports.bulkReject = async (req, res, next) => {
  try {
    const { passIds, reason } = req.body;
    if (!passIds || !passIds.length) return res.status(400).json({ message: "No requests selected" });
    if (!reason) return res.status(400).json({ message: "Rejection reason is required" });

    const user = await User.findByPk(req.user.id, { include: "Staff" });
    if (!user || !user.Staff) return res.status(404).json({ message: "Staff profile not found" });

    const passes = await GatePass.findAll({
      where: { gatepass_id: passIds },
      include: [{ association: "Student", include: "User" }]
    });

    for (const pass of passes) {
      if (pass.status === PASS_STATUS.PENDING) {
        pass.status = PASS_STATUS.REJECTED;
        pass.rejection_reason = reason;
        await pass.save();
        await TutorApproval.create({
          approved: false,
          reason: reason,
          GatePassGatepassId: pass.gatepass_id,
          StaffStaffId: user.Staff.staff_id
        });

        if (pass.Student && pass.Student.User) {
           await notifyUser(pass.Student.User.user_id, `Gate pass rejected. Reason: ${reason}`, { type: "error", reference_id: pass.gatepass_id });
           await notifyParent(pass.Student.student_id, `Gate pass request rejected. Reason: ${reason}`, { reference_id: pass.gatepass_id });
        }
      }
    }
    res.json({ message: `Rejected ${passIds.length} passes successfully` });
  } catch (err) {
    next(err);
  }
};

exports.getStudentHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const passes = await GatePass.findAll({
      where: { StudentStudentId: studentId },
      order: [["createdAt", "DESC"]]
    });
    res.json(passes);
  } catch (err) {
    next(err);
  }
};
