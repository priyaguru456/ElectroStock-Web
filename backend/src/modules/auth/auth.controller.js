const authService = require("./auth.service");
const { success, failure } = require("../../utils/apiResponse");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, result, "Login successful");
  } catch (err) {
    if (err.status) {
      return failure(res, err.message, err.status);
    }
    return next(err);
  }
}

async function logout(req, res) {
  return success(res, null, "Logged out");
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return success(res, user);
  } catch (err) {
    if (err.status) {
      return failure(res, err.message, err.status);
    }
    return next(err);
  }
}

module.exports = { login, logout, me };
