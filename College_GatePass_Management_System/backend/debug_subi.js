const { Student, User, Department, GatePass } = require('./src/models');
const sequelize = require('./src/config/database');

async function debugSubi() {
    try {
        const user = await User.findOne({ where: { name: 'Subi' } });
        if (!user) {
            console.log("User 'Subi' not found");
            return;
        }
        console.log("User found:", user.toJSON());

        const student = await Student.findOne({
            where: { UserUserId: user.user_id },
            include: [{ model: Department, as: 'Department' }]
        });

        if (!student) {
            console.log("Student record not found for Subi");
            return;
        }
        console.log("Student found:", student.toJSON());

        const passes = await GatePass.findAll({
            where: { StudentStudentId: student.student_id }
        });
        console.log("Gate Passes:", JSON.stringify(passes, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

debugSubi();
