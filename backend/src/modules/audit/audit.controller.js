const auditLogRepository = require("../../repositories/auditLog.repository");
const { success } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const result = await auditLogRepository.list({
      userId: req.query.userId ? Number(req.query.userId) : undefined,
      entityType: req.query.entityType,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { list };
