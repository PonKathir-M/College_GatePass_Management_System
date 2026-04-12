const { GatePass, Student, User, Department, SecurityLog, Staff } = require('./src/models');
const sequelize = require('./src/config/database');

async function debugSecurityData() {
    try {
        console.log("--- Checking Approved Passes Response Structure ---");
        const passes = await GatePass.findAll({
            where: { status: "HOD Approved" },
            include: [
                {
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
                },
                { model: SecurityLog }
            ],
            limit: 5
        });

        console.log(JSON.stringify(passes, null, 2));

        console.log("\n--- Checking Student 'Subi' Gate Pass Status ---");
        const subiUser = await User.findOne({ where: { name: 'Subi' } });
        if (subiUser) {
            const subiStudent = await Student.findOne({ where: { UserUserId: subiUser.user_id } });
            if (subiStudent) {
                const subiPasses = await GatePass.findAll({
                    where: { StudentStudentId: subiStudent.student_id },
                    order: [['createdAt', 'DESC']]
                });
                console.log(JSON.stringify(subiPasses, null, 2));
            } else {
                console.log("Student 'Subi' not found in Students table.");
            }
        } else {
            console.log("User 'Subi' not found.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugSecurityData();
