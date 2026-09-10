const attendanceRepository = require("../../repositories/attendance.repository");
const HttpError = require("../../utils/httpError");
const { EMPLOYEE_VIEWING_ROLES } = require("../../config/constants");

// Attendance.date is always the shift's start date, so a night shift that crosses
// midnight (e.g. 22:00-06:00) stays a single row instead of splitting across two days.
function shiftDateFor(now, shift) {
  if (!shift) return now;
  const [startHour] = shift.startTime.split(":").map(Number);
  const [endHour] = shift.endTime.split(":").map(Number);
  const overnight = endHour <= startHour;

  if (overnight && now.getHours() < startHour) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  return now;
}

function isLateCheckIn(now, shift) {
  if (!shift) return false;
  const [hour, minute] = shift.startTime.split(":").map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(hour, minute, 0, 0);
  return now > scheduled;
}

function isEarlyCheckOut(now, shift) {
  if (!shift) return false;
  const [hour, minute] = shift.endTime.split(":").map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(hour, minute, 0, 0);
  return now < scheduled;
}

async function checkIn(employeeId) {
  const now = new Date();
  const profile = await attendanceRepository.getEmployeeShift(employeeId);
  const shift = profile?.shift || null;
  const date = shiftDateFor(now, shift);

  const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, date);
  if (existing && existing.checkInAt) {
    throw new HttpError(409, "You have already checked in for this shift.");
  }

  const late = isLateCheckIn(now, shift);

  if (existing) {
    return attendanceRepository.update(existing.id, {
      checkInAt: now,
      status: late ? "LATE" : "PRESENT",
      isLate: late,
    });
  }

  return attendanceRepository.create({
    employeeId,
    date,
    checkInAt: now,
    status: late ? "LATE" : "PRESENT",
    isLate: late,
  });
}

async function checkOut(employeeId) {
  const now = new Date();
  const profile = await attendanceRepository.getEmployeeShift(employeeId);
  const shift = profile?.shift || null;
  const date = shiftDateFor(now, shift);

  const existing = await attendanceRepository.findByEmployeeAndDate(employeeId, date);
  if (!existing || !existing.checkInAt) {
    throw new HttpError(400, "You must check in before checking out.");
  }
  if (existing.checkOutAt) {
    throw new HttpError(409, "You have already checked out for this shift.");
  }

  const workingMinutes = Math.round((now - new Date(existing.checkInAt)) / 60000);
  const early = isEarlyCheckOut(now, shift);

  return attendanceRepository.update(existing.id, {
    checkOutAt: now,
    workingMinutes,
    isEarlyCheckout: early,
  });
}

function assertCanViewHistory(employeeId, actingUser) {
  if (employeeId === actingUser.id) return;
  if (EMPLOYEE_VIEWING_ROLES.includes(actingUser.role)) return;
  throw new HttpError(403, "You do not have permission to view this attendance history.");
}

async function history(employeeId, query, actingUser) {
  assertCanViewHistory(employeeId, actingUser);
  const { from, to, page, limit } = query;
  return attendanceRepository.history({
    employeeId,
    from,
    to,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
}

module.exports = { checkIn, checkOut, history };
