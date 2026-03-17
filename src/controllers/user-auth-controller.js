import userSession from "../models/user-session.js";
import {
  loginUserService,
  registerUserService,
  verifyEmailService,
  forgotPasswordService,
  verifyForgotPasswordService,
  userResetPasswordService,
  refreshUserTokenService,
  googleLoginService,
  checkTokenService,
} from "../services/user-auth.service.js";
import {
  ACCESS_COOKIE_OPTIONS,
  FORGOT_PASSWORD_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../utils/cookie.util.js";
import logger from "../utils/logger.js";

export const googleLogin = async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    const result = await googleLoginService({
      code: req.body.code,
      ip,
      userAgent: req.headers["user-agent"],
    });

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    res.cookie("userAccessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("userRefreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    logger.error(`GOOGLE LOGIN CONTROLLER ERROR: ${error.message}`);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const register = async (req, res) => {
  try {
    const result = await registerUserService(req.body);

    return res.status(result.status).json({
      message: result.message,
      otp: result.otp,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const result = await verifyEmailService(req.body);

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;

    const result = await loginUserService({
      email: req.body.email,
      password: req.body.password,
      ip,
      userAgent: req.headers["user-agent"],
    });

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    res.cookie("userAccessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("userRefreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    logger.error(`LOCAL LOGIN CONTROLLER ERROR: ${error.message}`);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const forgotPasswordOtp = async (req, res) => {
  try {
    const result = await forgotPasswordService(req.body);

    return res.status(result.status).json({
      message: result.message,
      otp: result.otp,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const result = await verifyForgotPasswordService(req.body);

    res.cookie(
      "userResetToken",
      result.userResetToken,
      FORGOT_PASSWORD_COOKIE_OPTIONS,
    );

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const userResetPassword = async (req, res) => {
  try {
    const token = req.cookies?.userResetToken;

    const result = await userResetPasswordService({
      token,
      newPassword: req.body.newPassword,
    });

    if (result.status === 200) {
      res.clearCookie("userResetToken");
    }

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(`RESET PASSWORD ERROR: ${error}`);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const checkToken = async (req, res) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    const token = req.cookies?.userAccessToken;

    const result = await checkTokenService(token);

    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    logger.error(`CHECK TOKEN ERROR: ${error}`);
    return res.status(500).json({ message: "Server error" });
  }
};

export const userRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.userRefreshToken;

    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token missing" });

    const result = await refreshUserTokenService(refreshToken);
    if (result.status !== 200) {
      return res.status(result.status).json({
        message: result.message,
      });
    }
    res.cookie("userAccessToken", result.accessToken, ACCESS_COOKIE_OPTIONS);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    logger.error(`USER REFRESH TOKEN ERROR: ${error}`);

    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }
};

export const userLogout = async (req, res) => {
  try {
    const { sessionId } = req.user;

    await userSession.findByIdAndUpdate(sessionId, {
      isActive: false,
    });

    res.clearCookie("userAccessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.clearCookie("userRefreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    logger.error(error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
