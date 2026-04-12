const { canApplyGatePass, getInitialStatus } = require("./src/services/workflowService");
const { isHoliday, isSunday } = require("./src/utils/helpers");

const now = new Date();
console.log(`Today: ${now.toDateString()}`);
console.log(`Is Holiday/Sunday? ${isHoliday(now) || isSunday()}`);

console.log("\n--- Testing Day Scholar ---");
const dayScholarCanApply = canApplyGatePass("Day Scholar");
console.log(`Day Scholar can apply? ${dayScholarCanApply} (Expected: false)`);

console.log("\n--- Testing Hosteller ---");
const hostellerCanApply = canApplyGatePass("Hosteller");
console.log(`Hosteller can apply? ${hostellerCanApply} (Expected: true - assuming correct time)`);

if (hostellerCanApply) {
    const status = getInitialStatus("Hosteller");
    console.log(`Hosteller Initial Status: ${status} (Expected: Warden Pending)`);
}
