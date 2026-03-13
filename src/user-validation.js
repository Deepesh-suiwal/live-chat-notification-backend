import { z } from "zod";

const passwordRegex =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      passwordRegex,
      "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
    ),
});

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const userLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  password: z.string().min(1, "Password is required"),
});

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),
});

export const userResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain at least 1 uppercase letter, 1 number, and 1 special character",
      ),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
