let io;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, {
      cors: {
        origin: " http://localhost:3000",
        methods: ["GET", "POST", "DELETE", "PUT"],
      },
    });
    return io;
  },
  getIO: () => {
    if (!io) {
      return null;
    }
    return io;
  },
};
