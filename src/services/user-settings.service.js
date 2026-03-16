import bcrypt from "bcryptjs";
import User from "../models/user-register.js";
import UserSettings from "../models/user-settings.js";
import { comparePassword } from "../utils/password.util.js";

export const updateThemeService = async (userId, body) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { theme: body.theme },
    { returnDocument: "after" },
  );

  return {
    status: 200,
    message: "Theme updated successfully",
    data: settings,
  };
};

export const updateOnlineStatusService = async (userId, body) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { showOnlineStatus: body.showOnlineStatus },
    { returnDocument: "after" },
  );

  return {
    status: 200,
    message: "Online status updated",
    data: settings,
  };
};

export const changePasswordService = async (userId, body) => {
  const user = await User.findById(userId).select("+password");

  const isMatch = await bcrypt.compare(body.oldPassword, user.password);

  if (!isMatch) {
    return {
      status: 400,
      message: "Old password incorrect",
    };
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 10);

  user.password = hashedPassword;

  user.passwordChangedAt = new Date();

  await user.save();

  return {
    status: 200,
    message: "Password changed successfully",
  };
};

export const logoutAllDevicesService = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    passwordChangedAt: new Date(),
  });

  return {
    status: 200,
    message: "Logged out from all devices",
  };
};

export const deleteAccountService = async (userId, body) => {
  const user = await User.findById(userId).select("+password");

  const isMatch = await comparePassword(body.password, user.password);

  if (!isMatch) {
    return {
      status: 400,
      message: "Password incorrect",
    };
  }

  await User.findByIdAndUpdate(userId, {
    deletedAt: new Date(),
    status: "INACTIVE",
  });

  return {
    status: 200,
    message: "Account deleted successfully",
  };
};
