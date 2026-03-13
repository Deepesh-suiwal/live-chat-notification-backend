import swaggerUi from "swagger-ui-express";

import { adminAuthSwagger } from "./admin-auth.swagger.js";
import { userAuthSwagger } from "./user-auth.swagger.js";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Live Chat Notification API",
    version: "1.0.0",
    description: "API documentation for backend",
  },

  servers: [
    {
      url: process.env.BACKEND_URL || "http://localhost:3000",
      description: "Development server",
    },
  ],

  tags: [
    {
      name: "Admin Auth",
      description: "Admin authentication APIs",
    },
    {
      name: "User Auth",
      description: "User authentication APIs",
    },
  ],
  components: {
    securitySchemes: {
      adminCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "adminAccessToken",
      },
      userCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "userAccessToken",
      },
        userResetPasswordAuth: {
        type: "apiKey",
        in: "cookie",
        name: "userResetToken",
      },
    },
  },
  paths: {
    ...adminAuthSwagger,
    ...userAuthSwagger,
  },
};

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(swaggerSpec, {
  explorer: true,
});
