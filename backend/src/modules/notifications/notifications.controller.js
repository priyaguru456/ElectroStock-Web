const notificationRepository = require("../../repositories/notification.repository");
const { success } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const result = await notificationRepository.listForUser(req.user.id, req.user.role, {
      isRead: req.query.isRead === undefined ? undefined : req.query.isRead === "true",
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await notificationRepository.markRead(Number(req.params.id), req.user.id, req.user.role);
    return success(res, null, "Marked as read");
  } catch (err) {
    return next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationRepository.markAllRead(req.user.id, req.user.role);
    return success(res, null, "All marked as read");
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, markRead, markAllRead };
