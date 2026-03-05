const bcrypt = require("bcryptjs");
const { User, Department, Staff, Student } = require("../models");

const seedDatabase = async () => {
  try {
    // Check if data already exists
    const existingDept = await Department.findOne();
    if (existingDept) {
      console.log("✅ Database already seeded");
      return;
    }

    // Create admin user first
    const adminHash = await bcrypt.hash("admin123", 10);
    const admin = await User.create({
      name: "Admin",
      email: "admin@gatepass.com",
      password: adminHash,
      role: "admin",
      active: true
    });
    console.log("✅ Admin user created");
    console.log("   📧 Email: admin@gatepass.com");
    console.log("   🔐 Password: admin123");

    // Create departments
    const departments = await Department.bulkCreate([
      { department_name: "Computer Science & Engineering" },
      { department_name: "Electronics & Communication" },
      { department_name: "Mechanical Engineering" },
      { department_name: "Civil Engineering" },
      { department_name: "Electrical Engineering" }
    ]);

    console.log("✅ Departments created:", departments.length);

    // Create staff/tutors for each department
    const staffUsers = [];
    const departmentIds = departments.map(d => d.department_id);
    
    const staffData = [
      { deptIdx: 0, name: "Dr. Arun Kumar", email: "arun@gatepass.com", password: "staff123" },
      { deptIdx: 0, name: "Ms. Priya Singh", email: "priya@gatepass.com", password: "staff123" },
      { deptIdx: 1, name: "Dr. Rajesh Patel", email: "rajesh@gatepass.com", password: "staff123" },
      { deptIdx: 2, name: "Prof. Vikram Sharma", email: "vikram@gatepass.com", password: "staff123" },
      { deptIdx: 3, name: "Dr. Neha Gupta", email: "neha@gatepass.com", password: "staff123" }
    ];

    for (const staff of staffData) {
      const staffHash = await bcrypt.hash(staff.password, 10);
      const staffUser = await User.create({
        name: staff.name,
        email: staff.email,
        password: staffHash,
        role: "staff",
        active: true
      });

      await Staff.create({
        UserUserId: staffUser.user_id,
        DepartmentDepartmentId: departmentIds[staff.deptIdx],
        role: "staff"
      });

      staffUsers.push({ user: staffUser, dept: staff.deptIdx });
    }

    console.log("✅ Staff members created:", staffData.length);

    // Create students for each department
    const studentData = [
      // CSE students
      { deptIdx: 0, name: "Arjun Verma", email: "arjun.student@gatepass.com", year: 2, category: "General", parent_phone: "9876543210", student_mobile_number: "9876500001" },
      { deptIdx: 0, name: "Kavya Sharma", email: "kavya.student@gatepass.com", year: 2, category: "General", parent_phone: "9876543211", student_mobile_number: "9876500002" },
      { deptIdx: 0, name: "Rohan Mishra", email: "rohan.student@gatepass.com", year: 1, category: "OBC", parent_phone: "9876543212", student_mobile_number: "9876500003" },
      { deptIdx: 0, name: "Sneha Patel", email: "sneha.student@gatepass.com", year: 1, category: "General", parent_phone: "9876543213", student_mobile_number: "9876500004" },
      // ECE students
      { deptIdx: 1, name: "Aditya Kumar", email: "aditya.student@gatepass.com", year: 3, category: "General", parent_phone: "9876543214", student_mobile_number: "9876500005" },
      { deptIdx: 1, name: "Nikita Singh", email: "nikita.student@gatepass.com", year: 2, category: "SC", parent_phone: "9876543215", student_mobile_number: "9876500006" },
      // MECH students
      { deptIdx: 2, name: "Harsh Patel", email: "harsh.student@gatepass.com", year: 2, category: "General", parent_phone: "9876543216", student_mobile_number: "9876500007" },
      { deptIdx: 2, name: "Pooja Desai", email: "pooja.student@gatepass.com", year: 1, category: "General", parent_phone: "9876543217", student_mobile_number: "9876500008" }
    ];

    for (const student of studentData) {
      const studentHash = await bcrypt.hash("student123", 10);
      const studentUser = await User.create({
        name: student.name,
        email: student.email,
        password: studentHash,
        role: "student",
        active: true
      });

      await Student.create({
        UserUserId: studentUser.user_id,
        DepartmentDepartmentId: departmentIds[student.deptIdx],
        year: student.year,
        category: student.category,
        parent_phone: student.parent_phone,
        student_mobile_number: student.student_mobile_number
      });
    }

    console.log("✅ Students created:", studentData.length);
    console.log("\n📋 Default Credentials:");
    console.log("   Admin: admin@gatepass.com / admin123");
    console.log("   Staff: arun@gatepass.com / staff123");
    console.log("   Student: arjun.student@gatepass.com / student123");

  } catch (err) {
    console.error("Seeding error:", err);
  }
};

module.exports = { seedDatabase };
