import crypto from "crypto";
import User from "../models/user-register.js";
import UserProfile from "../models/user-profile.js";
import Otp from "../models/user-otp.js";

import { hashPassword } from "../utils/password.util.js";
import { generateOtp, getOtpExpiry } from "../utils/generateOtp.util.js";

import { comparePassword } from "../utils/password.util.js";
import {
  createUserAccessToken,
  createUserRefreshToken,
  createUserResetToken,
  verifyUserRefreshToken,
} from "../utils/jwt.util.js";

import { sendEmail } from "../utils/email.util.js";
import { googleClient } from "../config/google.js";

import { env } from "../config/env.js";

import logger from "../utils/logger.js";

const OTP_CONFIG = {
  COOLDOWN_SECONDS: 60,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 5,
};

export const googleLoginService = async ({ code }) => {
  try {
    if (!code) {
      return {
        status: 400,
        message: "Authorization code is required",
      };
    }

    /* =====================================================
       1️⃣ Exchange authorization code for tokens
    ===================================================== */

    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    });

    if (!tokens.id_token) {
      return {
        status: 401,
        message: "Failed to retrieve Google ID token",
      };
    }

    /* =====================================================
       2️⃣ Verify Google ID Token
    ===================================================== */

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub) {
      return {
        status: 401,
        message: "Invalid Google token",
      };
    }

    const email = payload.email.toLowerCase().trim();
    const googleId = payload.sub;
    const fullName = payload.name || "Google User";

    /* =====================================================
       3️⃣ Find existing user
    ===================================================== */

    let user = await User.findOne({
      email,
      deletedAt: null,
    });

    /* =====================================================
       4️⃣ Create user if not exists
    ===================================================== */

    if (!user) {
      user = await User.create({
        email,
        fullName,
        authProvider: ["GOOGLE"],
        providerId: new Map([["GOOGLE", googleId]]),
        role: "USER",
        status: "ACTIVE",
        isEmailVerified: true,
        lastLoginProvider: "GOOGLE",
      });

      await UserProfile.create({
        userId: user._id,
        fullName,
      });
    } else if (!user.authProvider.includes("GOOGLE")) {
      /* =====================================================
       5️⃣ If account exists but Google not linked
    ===================================================== */

      user.authProvider.push("GOOGLE");

      if (!user.providerId) {
        user.providerId = new Map();
      }

      user.providerId.set("GOOGLE", googleId);
      user.isEmailVerified = true;
      user.lastLoginProvider = "GOOGLE";

      await user.save();
    } else {
      /* =====================================================
       6️⃣ Check Google ID mismatch
    ===================================================== */
      const storedGoogleId = user.providerId?.get("GOOGLE");

      if (storedGoogleId && storedGoogleId !== googleId) {
        return {
          status: 403,
          message: "Google account mismatch",
        };
      }
    }

    /* =====================================================
       7️⃣ Generate JWT Tokens
    ===================================================== */

    const accessToken = createUserAccessToken({
      userId: user._id,
      role: user.role,
    });

    const refreshToken = createUserRefreshToken({
      userId: user._id,
      role: user.role,
    });

    /* =====================================================
       8️⃣ Update login metadata
    ===================================================== */

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          lastLoginProvider: "GOOGLE",
        },
      },
    );

    /* =====================================================
       9️⃣ Remove password before returning
    ===================================================== */

    const userObj = user.toObject();
    delete userObj.password;

    return {
      status: 200,
      message: "Login successful",
      user: userObj,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`GOOGLE LOGIN SERVICE ERROR: ${error}`);

    return {
      status: 500,
      message: "Server error",
    };
  }
};

export const registerUserService = async ({ email, password, fullName }) => {
  const existingUser = await User.findOne({
    email,
    deletedAt: null,
  }).select("isEmailVerified authProvider");

  // GOOGLE only account
  if (
    existingUser &&
    existingUser.authProvider?.includes("GOOGLE") &&
    !existingUser.authProvider.includes("LOCAL")
  ) {
    return {
      status: 409,
      message:
        "This email is already registered using Google. Please use 'Forgot Password' to set a password.",
    };
  }

  // LOCAL user already verified
  if (existingUser?.isEmailVerified) {
    return {
      status: 409,
      message: "Email is already registered",
    };
  }

  // USER EXISTS BUT NOT VERIFIED
  if (existingUser && !existingUser.isEmailVerified) {
    const existingOtp = await Otp.findOne({
      email,
      purpose: "VERIFY_EMAIL",
    });

    if (existingOtp) {
      const secondsPassed =
        (Date.now() - existingOtp.updatedAt.getTime()) / 1000;

      if (secondsPassed < OTP_CONFIG.COOLDOWN_SECONDS) {
        return {
          status: 429,
          message: `Please wait ${Math.ceil(OTP_CONFIG.COOLDOWN_SECONDS - secondsPassed)} seconds before requesting a new OTP`,
        };
      }
    }

    const hashedPassword = await hashPassword(password);

    await User.updateOne(
      { email },
      {
        fullName,
        password: hashedPassword,
      },
    );

    const { otp, otpHash } = generateOtp();

    const expiresAt = getOtpExpiry(OTP_CONFIG.EXPIRY_MINUTES);

    await Otp.findOneAndUpdate(
      { email, purpose: "VERIFY_EMAIL" },
      {
        otpHash,
        expiresAt,
        attempts: 0,
      },
      { upsert: true },
    );

    // Send Email
    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your email",
      text: `Your verification OTP is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
    });
    if (!emailResult.success) {
      logger.error("OTP email sending failed");
    }
    return {
      status: 200,
      message: "OTP sent successfully",
      // otp, // optional (for sending email)
    };
  }

  // =========================
  // NEW USER
  // =========================

  const hashedPassword = await hashPassword(password);

  await User.create({
    email,
    fullName,
    password: hashedPassword,
    authProvider: ["LOCAL"],
    role: "USER",
    status: "INACTIVE",
    isEmailVerified: false,
    verificationEmailSentAt: new Date(),
  });

  const { otp, otpHash } = generateOtp();

  const expiresAt = getOtpExpiry(OTP_CONFIG.EXPIRY_MINUTES);

  await Otp.findOneAndUpdate(
    { email, purpose: "VERIFY_EMAIL" },
    {
      otpHash,
      expiresAt,
      attempts: 0,
    },
    { upsert: true },
  );
  // Send Email
  const emailResult = await sendEmail({
    to: email,
    subject: "Verify your email",
    text: `Your verification OTP is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
  });

  if (!emailResult.success) {
    logger.error("OTP email sending failed");
  }
  return {
    status: 201,
    message:
      "User registered successfully. OTP sent to email for verification.",
    // otp,
  };
};

export const verifyEmailService = async ({ email, otp }) => {
  if (!email || !otp) {
    return {
      status: 400,
      message: "Email and OTP are required",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  /* =======================================================
       1️⃣ Find OTP record
    ======================================================== */
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: "VERIFY_EMAIL",
  });

  if (!otpRecord) {
    return {
      status: 400,
      message: "OTP expired or invalid",
    };
  }

  /* =======================================================
       2️⃣ Check expiry
    ======================================================== */
  if (otpRecord.expiresAt.getTime() < Date.now()) {
    return {
      status: 400,
      message: "OTP expired or invalid",
    };
  }

  /* =======================================================
       3️⃣ Check max attempts
    ======================================================== */
  if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
    return {
      status: 429,
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
  }

  /* =======================================================
       4️⃣ Compare OTP (hash)
    ======================================================== */
  const incomingOtpHash = crypto.createHash("sha256").update(otp).digest("hex");

  if (incomingOtpHash !== otpRecord.otpHash) {
    await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });

    return {
      status: 400,
      message: "Invalid OTP",
    };
  }

  const user = await User.findOne({
    email: normalizedEmail,
    deletedAt: null,
  });

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  if (user.isEmailVerified) {
    return {
      status: 400,
      message: "Email already verified",
    };
  }

  await User.findByIdAndUpdate(user._id, {
    isEmailVerified: true,
    status: "ACTIVE",
  });

  const existingProfile = await UserProfile.findOne({
    userId: user._id,
  });

  if (!existingProfile) {
    await UserProfile.create({
      userId: user._id,
      profile: {
        fullName: user.fullName,
      },
    });
  }

  await Otp.deleteOne({
    email: normalizedEmail,
    purpose: "VERIFY_EMAIL",
  });

  return {
    status: 200,
    message: "Email verified successfully",
  };
};

export const loginUserService = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
    deletedAt: null,
  }).select(
    " +password role authProvider status fullName email isEmailVerified",
  );

  if (!user) {
    return { status: 404, message: "User not found" };
  }

  if (user.status === "INACTIVE") {
    return { status: 403, message: "User not active" };
  }

  if (user.status === "SUSPENDED") {
    return { status: 403, message: "Account suspended" };
  }

  if (!user.authProvider.includes("LOCAL")) {
    return { status: 403, message: "Use social login" };
  }

  if (!user.isEmailVerified) {
    return { status: 403, message: "Email not verified Please register again" };
  }

  const isPasswordValid =
    user.password && (await comparePassword(password, user.password));

  if (!isPasswordValid) {
    return { status: 401, message: "Invalid credentials" };
  }
  /* ==============================
     Update login metadata
  ============================== */

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        lastLoginAt: new Date(),
        lastLoginProvider: "LOCAL",
      },
    },
  );

  const accessToken = createUserAccessToken({
    userId: user._id,
    role: user.role,
  });

  const refreshToken = createUserRefreshToken({
    userId: user._id,
    role: user.role,
  });
  // Remove password before sending response
  const userObj = user.toObject();
  delete userObj.password;

  return {
    status: 200,
    message: "Login successful",
    user: userObj,
    accessToken,
    refreshToken,
  };
};

export const forgotPasswordService = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
    status: "ACTIVE",
    deletedAt: null,
  }).select("authProvider");

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  // cooldown check
  const existingOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose: "FORGOT_PASSWORD",
  });

  if (existingOtp) {
    const secondsPassed = (Date.now() - existingOtp.updatedAt.getTime()) / 1000;

    if (secondsPassed < OTP_CONFIG.COOLDOWN_SECONDS) {
      return {
        status: 429,
        message: `Please wait ${Math.ceil(
          OTP_CONFIG.COOLDOWN_SECONDS - secondsPassed,
        )} seconds before requesting a new OTP`,
      };
    }
  }

  // generate OTP
  const { otp, otpHash } = generateOtp();

  const expiresAt = getOtpExpiry(OTP_CONFIG.EXPIRY_MINUTES);

  await Otp.findOneAndUpdate(
    { email: normalizedEmail, purpose: "FORGOT_PASSWORD" },
    {
      otpHash,
      expiresAt,
      attempts: 0,
    },
    { upsert: true },
  );

  // Send Email
  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: "Reset Your Password",
    text: `Your password reset OTP is ${otp}. It expires in ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`,
  });

  if (!emailResult.success) {
    logger.error(`Forgot password email failed for ${normalizedEmail}`);
  } else {
    logger.info(`Forgot password OTP sent to ${normalizedEmail}`);
  }

  return {
    status: 200,
    message: `Password reset OTP sent to ${normalizedEmail}`,
  };
};

export const verifyForgotPasswordService = async ({ email, otp }) => {
  if (!email || !otp) {
    return {
      status: 400,
      message: "Email and OTP are required",
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: "FORGOT_PASSWORD",
  });

  if (!otpRecord) {
    return {
      status: 400,
      message: "OTP expired",
    };
  }

  // expiry check
  if (otpRecord.expiresAt.getTime() < Date.now()) {
    return {
      status: 400,
      message: "OTP expired",
    };
  }

  // attempts check
  if (otpRecord.attempts >= 5) {
    await otpRecord.deleteOne();

    return {
      status: 429,
      message: "Too many incorrect attempts",
    };
  }

  const incomingOtpHash = crypto.createHash("sha256").update(otp).digest("hex");

  if (incomingOtpHash !== otpRecord.otpHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    return {
      status: 401,
      message: "Invalid OTP",
    };
  }

  // OTP correct → delete
  await otpRecord.deleteOne();

  const user = await User.findOne({
    email: normalizedEmail,
    status: "ACTIVE",
    deletedAt: null,
  });

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  // create temporary reset token
  const userResetToken = createUserResetToken(user._id.toString());

  return {
    status: 200,
    message: "OTP verified successfully",
    userResetToken: userResetToken,
    expiresIn: "10 minutes",
  };
};

export const userResetPasswordService = async ({ token, newPassword }) => {
  if (!token) {
    return {
      status: 401,
      message: "OTP session expired or invalid",
    };
  }

  // verify token using helper
  const payload = verifyUserResetToken(token);

  if (!payload) {
    return {
      status: 401,
      message: "OTP session expired or invalid",
    };
  }

  // purpose check
  if (payload.purpose !== "PASSWORD_RESET") {
    return {
      status: 403,
      message: "Invalid password reset session",
    };
  }

  const userId = payload.sub;

  const user = await User.findById(userId);

  if (!user) {
    return {
      status: 404,
      message: ERRORS.USER_NOT_FOUND,
    };
  }

  // hash password
  const hashedPassword = await hashPassword(newPassword);

  user.password = hashedPassword;
  user.passwordChangedAt = new Date();

  await user.save();

  return {
    status: 200,
    message: "Password reset successful",
  };
};

export const refreshUserTokenService = async (refreshToken) => {
  if (!refreshToken) {
    return {
      status: 401,
      message: "Refresh token missing",
    };
  }

  let payload;

  try {
    payload = verifyUserRefreshToken(refreshToken);
  } catch (err) {
    return {
      status: 401,
      message: "Invalid refresh token",
    };
  }

  if (!payload || payload.role !== "USER" || !payload.userId) {
    return {
      status: 401,
      message: "Invalid refresh token",
    };
  }

  const user = await User.findById(payload.userId);

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    return {
      status: 403,
      message: "Account disabled",
    };
  }

  if (
    user.passwordChangedAt &&
    payload.iat &&
    payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000
  ) {
    return {
      status: 401,
      message: "Password changed, login again",
    };
  }

  const newAccessToken = createUserAccessToken({
    userId: payload.userId,
    role: payload.role,
  });

  return {
    status: 200,
    message: "Access token refreshed",
    accessToken: newAccessToken,
  };
};
