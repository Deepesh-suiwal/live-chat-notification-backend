export const userAuthSwagger = {
  "/api/users/auth/google-login": {
    post: {
      tags: ["User Auth"],
      summary: "Login user using Google OAuth",
      description:
        "Authenticates a user using Google OAuth authorization code. The backend exchanges the authorization code for a Google ID token, verifies it, and logs in or creates the user. Access and refresh tokens are issued and stored in HTTP-only cookies.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["code"],
              properties: {
                code: {
                  type: "string",
                  example: "4/0AVMBsJjexampleAuthorizationCode123",
                  description:
                    "Authorization code returned by Google OAuth after user consent.",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Login successful",
                  },
                  user: {
                    type: "object",
                    properties: {
                      _id: {
                        type: "string",
                        example: "65f3c9e9f2a5b3d123456789",
                      },
                      fullName: {
                        type: "string",
                        example: "Rahul Sharma",
                      },
                      email: {
                        type: "string",
                        example: "rahul@gmail.com",
                      },
                      role: {
                        type: "string",
                        example: "USER",
                      },
                    },
                  },
                },
              },
            },
          },
        },

        400: {
          description: "Authorization code missing or invalid request",
        },

        401: {
          description: "Invalid Google token or token verification failed",
        },

        403: {
          description: "Google account mismatch",
        },

        500: {
          description: "Internal server error",
        },
      },

      security: [],
    },
  },

  "/api/users/auth/register": {
    post: {
      tags: ["User Auth"],
      summary: "Register a new user",
      description:
        "Registers a new user using email and password. If the user already exists but email is not verified, a new OTP will be generated and sent again.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["fullName", "email", "password"],
              properties: {
                fullName: {
                  type: "string",
                  example: "Rahul Sharma",
                },
                email: {
                  type: "string",
                  format: "email",
                  example: "rahul@example.com",
                },
                password: {
                  type: "string",
                  format: "password",
                  example: "StrongPassword@123",
                },
              },
            },
          },
        },
      },

      responses: {
        201: {
          description:
            "New user registered successfully and OTP sent for verification",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example:
                      "User registered successfully. OTP sent to email for verification.",
                  },
                },
              },
            },
          },
        },

        200: {
          description:
            "User exists but email not verified, OTP re-sent successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "OTP sent successfully",
                  },
                },
              },
            },
          },
        },

        409: {
          description: "Email already registered and verified",
        },

        429: {
          description: "OTP resend cooldown active",
        },

        500: {
          description: "Internal server error",
        },
      },

      security: [],
    },
  },

  "/api/users/auth/verify-email": {
    post: {
      tags: ["User Auth"],
      summary: "Verify user email using OTP",
      description:
        "Verifies a user's email using the OTP sent to their email address during registration.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "rahul@example.com",
                },
                otp: {
                  type: "string",
                  example: "123456",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Email verified successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Email verified successfully",
                  },
                },
              },
            },
          },
        },

        400: {
          description: "Invalid OTP or validation error",
        },

        404: {
          description: "User not found",
        },

        500: {
          description: "Internal server error",
        },
      },

      security: [],
    },
  },
  "/api/users/auth/login": {
    post: {
      tags: ["User Auth"],
      summary: "Login user using email and password",
      description:
        "Authenticates a user using email and password. If credentials are valid and the account is active and verified, access and refresh tokens are issued and stored in cookies.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "rahul@example.com",
                },
                password: {
                  type: "string",
                  format: "password",
                  example: "Password@123",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Login successful",
                  },
                  user: {
                    type: "object",
                    properties: {
                      _id: {
                        type: "string",
                        example: "65f3c9e9f2a5b3d123456789",
                      },
                      fullName: {
                        type: "string",
                        example: "Rahul Sharma",
                      },
                      email: {
                        type: "string",
                        example: "rahul@example.com",
                      },
                      role: {
                        type: "string",
                        example: "USER",
                      },
                    },
                  },
                },
              },
            },
          },
        },

        401: {
          description: "Invalid email or password",
        },

        403: {
          description:
            "User not active, account suspended, social login required, or email not verified",
        },

        404: {
          description: "User not found",
        },

        500: {
          description: "Internal server error",
        },
      },

      security: [],
    },
  },

  "/api/users/auth/forgot-password": {
    post: {
      tags: ["User Auth"],
      summary: "Send forgot password OTP",
      description:
        "Generates and sends an OTP to the user's email for password reset. If an OTP was recently requested, a cooldown period will apply.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "rahul@example.com",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Password reset OTP sent successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Password reset OTP sent to rahul@example.com",
                  },
                  otp: {
                    type: "string",
                    example: "123456",
                    description:
                      "Returned only in development mode for testing",
                  },
                },
              },
            },
          },
        },

        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "User not found",
                  },
                },
              },
            },
          },
        },

        429: {
          description: "OTP request cooldown active",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example:
                      "Please wait 30 seconds before requesting a new OTP",
                  },
                },
              },
            },
          },
        },

        500: {
          description: "Internal server error",
        },
      },

      security: [],
    },
  },

  "/api/users/auth/verify-forgot-password-otp": {
    post: {
      tags: ["User Auth"],
      summary: "Verify forgot password OTP",
      description:
        "Verifies the OTP sent to the user's email for password reset. If valid, a temporary reset token will be issued via HTTP-only cookie.",

      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "rahul@example.com",
                },
                otp: {
                  type: "string",
                  example: "123456",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "OTP verified successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "OTP verified successfully",
                  },
                  expiresIn: {
                    type: "string",
                    example: "10 minutes",
                  },
                },
              },
            },
          },
        },

        400: {
          description: "Missing fields or OTP expired",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Email and OTP are required",
                  },
                },
              },
            },
          },
        },

        401: {
          description: "Invalid OTP",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Invalid OTP",
                  },
                },
              },
            },
          },
        },

        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "User not found",
                  },
                },
              },
            },
          },
        },

        429: {
          description: "Too many incorrect OTP attempts",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Too many incorrect attempts",
                  },
                },
              },
            },
          },
        },

        500: {
          description: "Internal server error",
        },
      },

      security: [],
    },
  },

  "/api/users/auth/reset-password": {
    post: {
      tags: ["User Auth"],
      summary: "Reset user password using verified OTP session",
      description:
        "Resets the user's password after successful OTP verification. Requires a valid reset token stored in an HTTP-only cookie.",
      security: [{ userResetPasswordAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["newPassword", "confirmPassword"],
              properties: {
                newPassword: {
                  type: "string",
                  format: "password",
                  example: "StrongPassword@123",
                  description:
                    "New password for the user account (must meet security requirements)",
                },
                confirmPassword: {
                  type: "string",
                  format: "password",
                  example: "StrongPassword@123",
                  description: "Confirm password must match the new password",
                },
              },
            },
          },
        },
      },

      responses: {
        200: {
          description: "Password reset successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Password reset successful",
                  },
                },
              },
            },
          },
        },

        401: {
          description: "OTP session expired or invalid",
        },

        403: {
          description: "Invalid password reset session",
        },

        404: {
          description: "User not found",
        },

        500: {
          description: "Internal server error",
        },
      },
    },
  },
  "/api/users/auth/refresh-token": {
    post: {
      tags: ["User Auth"],
      summary: "Generate new access token using refresh token",
      description:
        "Generates a new access token if the user still has a valid refresh token stored in an HTTP-only cookie. This endpoint is used when the access token expires but the refresh token is still valid.",

      requestBody: {
        required: false,
        description:
          "No request body required. Refresh token is read from the HTTP-only cookie.",
        content: {
          "application/json": {
            // schema: {
            //   type: "object",
            //   example: {},
            // },
          },
        },
      },

      responses: {
        200: {
          description: "Access token refreshed successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Access token refreshed",
                  },
                },
              },
            },
          },
        },

        401: {
          description: "Refresh token missing or invalid",
        },

        403: {
          description: "User account disabled",
        },

        500: {
          description: "Internal server error",
        },
      },

      security: [],
    },
  },
  "/api/users/auth/logout": {
    post: {
      tags: ["User Auth"],
      summary: "Logout user",
      description:
        "Logs out the authenticated user by clearing the HTTP-only access and refresh token cookies from the browser.",
      security: [
        {
          userCookieAuth: [],
        },
      ],
      requestBody: {
        required: false,
        description:
          "No request body required. Logout works by clearing authentication cookies.",
        content: {
          "application/json": {
            // schema: {
            //   type: "object",
            //   example: {},
            // },
          },
        },
      },

      responses: {
        200: {
          description: "Logout successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Logout successful",
                  },
                },
              },
            },
          },
        },

        500: {
          description: "Internal server error",
        },
      },
    },
  },
  "/api/users/auth/check-token": {
    get: {
      tags: ["User Auth"],
      summary: "Check user authentication token",
      description:
        "Verifies the user access token from HTTP-only cookies and returns user details if the token is valid.",
      security: [
        {
          userCookieAuth: [],
        },
      ],
      requestBody: {
        required: false,
        description:
          "No request body required. The user access token is automatically read from HTTP-only cookies.",
        content: {
          "application/json": {},
        },
      },

      responses: {
        200: {
          description: "User token valid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: true,
                  },
                  user: {
                    type: "object",
                    properties: {
                      userId: {
                        type: "string",
                        example: "665bfc29b43c72c01a93b210",
                      },
                      fullName: {
                        type: "string",
                        example: "User Name",
                      },
                      email: {
                        type: "string",
                        example: "user@example.com",
                      },
                      role: {
                        type: "string",
                        example: "USER",
                      },
                    },
                  },
                },
              },
            },
          },
        },

        401: {
          description: "Unauthorized - Invalid or missing user token",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Unauthorized",
                  },
                },
              },
            },
          },
        },

        403: {
          description: "Forbidden - Token does not belong to an admin",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "Forbidden",
                  },
                },
              },
            },
          },
        },

        500: {
          description: "Internal server error",
        },
      },
    },
  },
};
