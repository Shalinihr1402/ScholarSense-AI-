import jwt from "jsonwebtoken";

const fallbackSecret = "scholarsense_dev_secret_change_before_deployment";

export function signAuthToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id?.toString(),
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET || fallbackSecret,
    { expiresIn: "7d" }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || fallbackSecret);
}
