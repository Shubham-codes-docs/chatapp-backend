const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Queue = require("./utils/Queue");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const sharedSession = require("express-socket.io-session");
const { v4: uuidv4 } = require("uuid");

const queue = new Queue();

const socket = require("./utils/socket");
const userRoute = require("./routes/userRoute");
const groupRoute = require("./routes/groups");
const Chats = require("./models/Chats");
const Groups = require("./models/Group");

const app = express();
dotenv.config();
app.use(express.json());

const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "Session",
});

let expressSession = session({
  secret: "My Secret",
  resave: false,
  saveUninitialized: false,
  store: store,
});

app.use(expressSession);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS,GET,POST,PUT,PATCH,DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/api/auth", userRoute);
app.use("/api/groups", groupRoute);
app.get("/", (req, res) => {
  res.json({ msg: "Chat App Connected", ip: req.ip });
});

app.use((error, req, res, next) => {
  console.log("The error is " + error.message);
  res.status(error.statusCode).json({ error: error.message });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Sever running on Port ${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected");
    const io = socket.init(server);
    io.use(
      sharedSession(expressSession, {
        autoSave: true,
      })
    );

    io.on("connection", async (socket) => {
      const sessionId = socket.handshake.auth.sessionId;
      if (sessionId) {
        const storedSession = socket.handshake.auth.sessionId;
        if (storedSession) {
          socket.sessionId = sessionId;
          socket.userId = socket.handshake.auth.userId;
        }
      } else {
        socket.sessionId = uuidv4();
        socket.userId = socket.handshake.auth.userId;
        socket.handshake.session.sessionId = socket.sessionId;
        socket.handshake.session.save();
      }

      //emiting session details to user
      socket.emit("session", {
        sessionId: socket.sessionId,
        userId: socket.userId,
      });

      //joining users to rooms of their own user id
      socket.join(socket.userId);

      //getting messages from database for disconnected users
      socket.on("get-private-messages", async () => {
        const messages = await Chats.find({
          $or: [
            {
              from: socket.userId,
            },
            {
              to: socket.userId,
            },
          ],
        });

        socket.emit("get-private-messages", {
          messages,
        });
      });

      socket.on("get-group-messages", async () => {
        const memberGroups = await Groups.find({
          participants: socket.userId,
        });

        const groupId = memberGroups.map((group) => {
          return group._id;
        });

        const messages = await Chats.find({
          to: groupId,
        });

        socket.emit("get-group-messages", {
          messages,
        });
      });

      //private messages are received and emitted here
      socket.on(
        "private-message",
        async ({ to, content, from, sentTime, groupId }) => {
          //check if to user is logged in or not
          let connectedSockets = await io.fetchSockets();
          let isDelivered = false;
          connectedSockets.map((conn) => {
            if (conn.userId === to) {
              isDelivered = true;
            }
          });

          //saving incoming messages to a queue
          let message = {
            content,
            from,
            to,
            starred: false,
            messageStatus: isDelivered ? "delivered" : "sent",
            sentAt: sentTime,
            deliveredAt: isDelivered && new Date(),
          };

          queue.enqueue(message);

          //saving to database from the queue

          while (!queue.isEmpty()) {
            queue.index += 1;
            const newChat = new Chats(queue.dequeue());

            try {
              const savedChat = await newChat.save();
              if (savedChat) {
                socket.join(to);
                socket.to(to).emit("private-message", {
                  content,
                  from,
                  sentTime,
                  messageStatus: savedChat.messageStatus,
                  groupId,
                });

                socket.emit("handleMessageStatus", {
                  id: savedChat._id,
                  messageStatus: savedChat.messageStatus,
                  index: queue.index,
                  length: queue.length(),
                  to: to,
                });
              } else {
                console.log("Not saved");
              }
            } catch (e) {
              console.log(e);
            }
          }

          if (queue.isEmpty()) queue.index = 0;
        }
      );

      //handle the status of existing messages
      socket.on("handleStatusChange", async ({ id, message }) => {
        let connectedSockets = await io.fetchSockets();
        if (message === "read") {
          connectedSockets.forEach(async (conn) => {
            if (conn.userId === id) {
              let results = await Chats.updateMany(
                { to: socket.userId || id },
                { messageStatus: message, deliveredAt: new Date() }
              );
              connectedSockets.map((conn) => {
                socket.to(conn.userId).emit("handleMessageStatus", {
                  id: null,
                  messageStatus: "read",
                  to: socket.userId || id,
                });
              });
            }
          });
        }
        if (message === "delivered") {
          let results = await Chats.updateMany(
            { to: socket.userId || id, messageStatus: { $nin: "read" } },
            { messageStatus: message, deliveredAt: new Date() }
          );
          connectedSockets.map((conn) => {
            socket.to(conn.userId).emit("handleMessageStatus", {
              id: null,
              messageStatus: "delivered",
              to: socket.userId || id,
            });
          });
        }
      });

      //set the status of messages to read
      socket.on("handle-read-message-status", async ({ id }) => {
        await Chats.updateMany();
      });

      //making a video call
      socket.on("callUser", ({ userToCall, signalData, from }) => {
        socket.to(userToCall).emit("callUser", {
          signal: signalData,
          from,
          to: userToCall,
        });
      });

      //answer video call
      socket.on("answerCall", (data) => {
        socket.to(data.to).emit("callAccepted", { signal: data.signal });
      });
    });
  });
