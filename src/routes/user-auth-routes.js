import express from "express";
import {
  forgotPasswordOtp,
  googleLogin,
  register,
  userLogin,
  userLogout,
  userRefreshToken,
  userResetPassword,
  verifyEmail,
  verifyForgotPasswordOtp,
} from "../controllers/user-auth-controller.js";
import { validate } from "../middlewares/validate.js";
import {
  emailSchema,
  registerSchema,
  userLoginSchema,
  userResetPasswordSchema,
  verifyEmailSchema,
} from "../user-validation.js";

const router = express.Router();
router.post("/google-login", googleLogin);
router.post("/register", validate(registerSchema), register);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

router.post("/login", validate(userLoginSchema), userLogin);
router.post("/forgot-password", validate(emailSchema), forgotPasswordOtp);
router.post(
  "/verify-forgot-password-otp",
  validate(verifyEmailSchema),
  verifyForgotPasswordOtp,
);
router.post(
  "/reset-password",
  validate(userResetPasswordSchema),
  userResetPassword,
);
router.post("/refresh-token", userRefreshToken);
router.post("/logout", userLogout);
export default router;
