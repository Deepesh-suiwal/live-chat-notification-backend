import { Server } from "socket.io";
import logger from "../utils/logger.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on("send_message", (data) => {
      io.emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
