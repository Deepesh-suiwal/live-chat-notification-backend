import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user-auth-routes.js";
import adminRoutes from "./routes/admin.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";
import { swaggerUiServe, swaggerUiSetup } from "./swagger/swagger.js";

import { env } from "./config/env.js";

dotenv.config();

const app = express();

app.use(helmet()); // 🔒 security headers

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Swagger docs
app.use("/api-docs", swaggerUiServe, swaggerUiSetup);

// =======================
// ROUTES
// =======================

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// =======================
// HEALTH CHECK
// =======================

app.get("/", (req, res) => {
  res.json({
    message: "Live Chat Notification Backend Running 🚀",
  });
});

// =======================
// 404
// =======================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});
// GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
