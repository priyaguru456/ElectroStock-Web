function success(res, data, message = "Success", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function failure(res, message = "Something went wrong", status = 400, errors = undefined) {
  return res.status(status).json({ success: false, message, errors });
}

module.exports = { success, failure };
