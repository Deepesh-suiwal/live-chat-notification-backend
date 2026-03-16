import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import User from "../models/user-register.js";
import userSession from "../models/user-session.js";

export const verifyUserAccessToken = async (req, res, next) => {
  try {
    const token = req.cookies?.userAccessToken;

    if (!token) {
      logger.info("Token not found");
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, env.USER_JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user || user.status !== "ACTIVE" || user.deletedAt) {
      return res.status(403).json({ message: "Account disabled" });
    }

    if (
      user.passwordChangedAt &&
      decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000
    ) {
      return res.status(401).json({ message: "Password changed, login again" });
    }
    const userSessions = await userSession.findById(decoded.sessionId);
    if (
      !userSessions ||
      userSessions.isActive !== true ||
      userSessions.userId.toString() !== decoded.userId
    ) {
      return res.status(401).json({ message: "Session not found or expired" });
    }
    req.user = decoded;

    next();
  } catch (error) {
    logger.error("Access token expired or invalid");
    return res.status(401).json({
      message: "Access token expired or invalid",
    });
  }
};
