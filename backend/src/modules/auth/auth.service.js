const userRepository = require("../../repositories/user.repository");
const { comparePassword } = require("../../utils/hash");
const { signToken } = require("../../utils/jwt");
const HttpError = require("../../utils/httpError");

async function login(email, password) {
  const user = await userRepository.findByEmail(email);

  if (!user || user.status !== "ACTIVE") {
    throw new HttpError(401, "Invalid credentials");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, "Invalid credentials");
  }

  const token = signToken({ userId: user.id, role: user.role });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
}

module.exports = { login, getCurrentUser };
