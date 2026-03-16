import express from "express";
import { verifyUserAccessToken } from "../middlewares/user-auth.middleware.js";

import { validate } from "../middlewares/validate.js";
import {
  updateThemeSchema,
  updateOnlineStatusSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "../user-validation.js";
import {
  changePassword,
  deleteAccount,
  logoutAllDevices,
  updateOnlineStatus,
  updateTheme,
} from "../controllers/user-settings.controller.js";

const router = express.Router();

router.use(verifyUserAccessToken);

router.patch("/theme", validate(updateThemeSchema), updateTheme);

router.patch(
  "/online-status",
  validate(updateOnlineStatusSchema),
  updateOnlineStatus,
);

router.patch(
  "/change-password",
  validate(changePasswordSchema),
  changePassword,
);

router.post("/logout-all", logoutAllDevices);

router.delete("/delete-account", validate(deleteAccountSchema), deleteAccount);

export default router;
