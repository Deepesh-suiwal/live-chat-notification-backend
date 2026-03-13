import sgMail from "@sendgrid/mail";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

sgMail.setApiKey(env.SENDGRID_API_KEY);

export const sendEmail = async ({ to, subject, text }) => {
  try {
    const msg = {
      to,
      from: env.EMAIL_FROM,
      subject,
      text,
    };

    const response = await sgMail.send(msg);

    logger.info(`Email sent successfully to ${to} | subject: ${subject}`);

    return {
      success: true,
      response,
    };
  } catch (error) {
    logger.error(
      `SendGrid Email Error | to: ${to} | subject: ${subject} | error: ${error?.message}`,
    );

    if (error.response) {
      logger.error(
        `SendGrid Response Error: ${JSON.stringify(error.response.body)}`,
      );
    }

    return {
      success: false,
      error: error.message,
    };
  }
};
