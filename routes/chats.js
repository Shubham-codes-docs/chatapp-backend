const express = require("express");
const Chats = require("../controllers/Chats");
const Auth = require("../middleware/auth");

const router = express.Router("/add-chat", Auth, Chats.addChat);

router.post("/add-message");
