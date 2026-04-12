const { canApplyGatePass, getInitialStatus } = require("./src/services/workflowService");
const { isHoliday, isSunday } = require("./src/utils/helpers");

// Mock Date to be 10:00 AM today
const originalDate = Date;
global.Date = class extends Date {
    constructor() {
        super();
        // Return today but at 10 AM
        const d = new originalDate();
        d.setHours(10);
        d.setMinutes(0);
        return d;
    }
};

console.log(`--- Testing with Mocked Time: 10:00 AM ---`);

console.log("\n--- Testing Day Scholar on Holiday ---");
const dayScholarCanApply = canApplyGatePass("Day Scholar");
console.log(`Day Scholar can apply? ${dayScholarCanApply} (Expected: false)`);

console.log("\n--- Testing Hosteller on Holiday ---");
const hostellerCanApply = canApplyGatePass("Hosteller");
console.log(`Hosteller can apply? ${hostellerCanApply} (Expected: true)`);

if (hostellerCanApply) {
    const status = getInitialStatus("Hosteller");
    console.log(`Hosteller Initial Status: ${status} (Expected: Warden Pending)`);
}

// Restore Date
global.Date = originalDate;
