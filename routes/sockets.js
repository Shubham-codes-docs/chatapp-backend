const express = require("express");
const Socket = require("../controllers/Socket");

const router = express.Router();

router.post("/connect-socket", Socket.connectSocket);

module.exports = router;
