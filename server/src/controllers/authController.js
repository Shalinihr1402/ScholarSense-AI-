import bcrypt from "bcryptjs";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import { createLocalUser, findLocalUserByEmail, safeLocalUser } from "../services/localUserStore.js";
import { upsertLocalProfile } from "../services/localProfileStore.js";
import { signAuthToken } from "../utils/token.js";

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
