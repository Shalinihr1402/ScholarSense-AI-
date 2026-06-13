import User from "../models/User.js";
import { safeLocalUser } from "../services/localUserStore.js";
import { verifyAuthToken } from "../utils/token.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required." });
    }

    const payload = verifyAuthToken(token);
    let user = null;

    if (User.db.readyState === 1) {
      user = await User.findById(payload.id).select("-password");
    } else {
      user = safeLocalUser({
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.email?.split("@")[0] || "Student"
      });
    }

    if (!user) {
      return res.status(401).json({ message: "User account was not found." });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource." });
    }

    next();
  };
}
