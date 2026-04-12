const { Student, User } = require('./src/models');

async function checkStudentPhone() {
    const email = process.argv[2];
    if (!email) {
        console.log("Usage: node check_student_phone.js <student_email>");
        process.exit(1);
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log("❌ User not found!");
            return;
        }

        const student = await Student.findOne({ where: { UserUserId: user.user_id } });
        if (!student) {
            console.log("❌ Student profile not found!");
            return;
        }

        console.log(`\n🔍 Checking Data for: ${user.name}`);
        console.log(`--------------------------------`);
        console.log(`Email:        ${user.email}`);
        console.log(`Parent Phone: ${student.parent_phone ? student.parent_phone : "❌ NOT SET"}`);
        console.log(`--------------------------------`);

        if (!student.parent_phone) {
            console.log("💡 The database does NOT have a phone number for this student.");
            console.log("   Please edit the student in Admin Dashboard and add the number.");
        } else {
            console.log("✅ Phone number is present. SMS should work.");
        }

    } catch (err) {
        console.error(err);
    }
}

checkStudentPhone();
