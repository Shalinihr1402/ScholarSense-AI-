import bcrypt from "bcryptjs";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import { createLocalUser, findLocalUserByEmail, safeLocalUser, updateLocalUser } from "../services/localUserStore.js";
import { upsertLocalProfile } from "../services/localProfileStore.js";
import { signAuthToken } from "../utils/token.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/emailService.js";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendAuthResponse(res, user, status = 200) {
  const token = signAuthToken(user);

  res.status(status).json({
    token,
    user: {
      id: user.id || user._id?.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: Boolean(user.isEmailVerified)
    }
  });
}

export async function register(req, res, next) {
  try {
    const {
      name, email, password, role = "student",
      dateOfBirth, state, category, annualIncome, course
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid user role." });
    }

    const profileSeed = {
      fullName: name.trim(),
      state: state || "",
      category: category || "",
      annualIncome: annualIncome ? Number(annualIncome) : null,
      course: course || ""
    };

    if (User.db.readyState === 1) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail });

      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        role,
        dateOfBirth: dateOfBirth || null
      });

      // Auto-create a StudentProfile so eligibility runs immediately after signup
      if (role === "student") {
        await StudentProfile.create({ userId: user._id, ...profileSeed });
      }

      return sendAuthResponse(res, user, 201);
    }

    const user = await createLocalUser({ name, email, password, role });

    if (role === "student") {
      await upsertLocalProfile(user.id, profileSeed);
    }

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    let user = null;

    if (User.db.readyState === 1) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      user = await findLocalUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return sendAuthResponse(res, User.db.readyState === 1 ? user : safeLocalUser(user));
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res) {
  res.json({ user: req.user });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    let user = null;
    const normalizedEmail = email.toLowerCase().trim();

    if (User.db.readyState === 1) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      user = await findLocalUserByEmail(normalizedEmail);
    }

    if (!user) {
      // Don't leak whether user exists or not for security
      return res.status(200).json({ message: "If that email is in our system, we've sent a password reset link." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    if (User.db.readyState === 1) {
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();
    } else {
      await updateLocalUser(user.id, { resetPasswordToken: resetToken, resetPasswordExpires: resetPasswordExpires.toISOString() });
    }

    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail({ user, resetUrl });

    res.status(200).json({ message: "If that email is in our system, we've sent a password reset link." });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    let user = null;

    if (User.db.readyState === 1) {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
    } else {
      const users = await import("fs/promises").then(fs => fs.readFile(new URL("../../data/users.local.json", import.meta.url), "utf8")).then(JSON.parse).catch(() => []);
      user = users.find(u => u.resetPasswordToken === token && new Date(u.resetPasswordExpires) > new Date());
    }

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (User.db.readyState === 1) {
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    } else {
      await updateLocalUser(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
    }

    res.status(200).json({ message: "Password has been successfully reset. You can now log in." });
  } catch (error) {
    next(error);
  }
}
