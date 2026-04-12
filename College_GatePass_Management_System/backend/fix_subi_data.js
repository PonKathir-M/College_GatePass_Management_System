const { Student, User, GatePass } = require('./src/models');
const sequelize = require('./src/config/database');

async function fixSubiData() {
    try {
        const user = await User.findOne({ where: { name: 'Subi' } });
        if (!user) {
            console.log("User 'Subi' not found");
            return;
        }

        // Update Student Department
        const student = await Student.findOne({ where: { UserUserId: user.user_id } });
        if (student) {
            student.DepartmentDepartmentId = 27; // CSE
            await student.save();
            console.log("Updated Subi's department to CSE (27)");
        }

        // Approve Gate Pass
        const pass = await GatePass.findOne({
            where: {
                StudentStudentId: student.student_id,
                status: 'HOD Pending'
            }
        });

        if (pass) {
            pass.status = 'HOD Approved';
            await pass.save();
            console.log(`Approved Gate Pass ${pass.gatepass_id}`);
        } else {
            console.log("No pending gate pass found for Subi to approve.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixSubiData();
