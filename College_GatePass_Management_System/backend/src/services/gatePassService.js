const { GatePass } = require("../models");
const generateId = require("../utils/generateGatePassId");

exports.createGatePass = async (data) => {
  return await GatePass.create({
    gatepass_id: generateId(),
    reason: data.reason,
    out_time: data.out_time,
    expected_return: data.expected_return,
    status: data.status,
    StudentStudentId: data.studentId
  });
};

exports.updateStatus = async (id, status, reason = null) => {
  const pass = await GatePass.findByPk(id);
  pass.status = status;
  if (reason) pass.rejection_reason = reason;
  await pass.save();
  return pass;
};
