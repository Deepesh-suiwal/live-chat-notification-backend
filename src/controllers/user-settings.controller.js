import {deleteAccountService, 
  changePasswordService,
  logoutAllDevicesService,
  updateOnlineStatusService,
  updateThemeService,
} from "../services/user-settings.service.js";

export const updateTheme = async (req, res) => {
  const userId = req.user.userId;

  const result = await updateThemeService(userId, req.body);

  res.status(result.status).json(result);
};

export const updateOnlineStatus = async (req, res) => {
  const userId = req.user.userId;

  const result = await updateOnlineStatusService(userId, req.body);

  res.status(result.status).json(result);
};

export const changePassword = async (req, res) => {
  const userId = req.user.userId;

  const result = await changePasswordService(userId, req.body);

  res.status(result.status).json(result);
};

export const logoutAllDevices = async (req, res) => {
  const userId = req.user.userId;

  const result = await logoutAllDevicesService(userId);

  res.status(result.status).json(result);
};

export const deleteAccount = async (req, res) => {
  const userId = req.user.userId;

  const result = await deleteAccountService(userId, req.body);

  res.status(result.status).json(result);
};
