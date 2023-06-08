const express = require("express");
const Groups = require("../controllers/Groups");
const Auth = require("../middleware/auth");

const router = express.Router();

router.post("/add-group", Auth, Groups.createGroup);

module.exports = router;
