const express = require("express");
const Users = require("../controllers/Users");
const Auth = require("../middleware/auth");
// const checkIO = require("../middleware/io");

const router = express.Router();

router.post("/register", Users.AddUsers);
router.post("/login", Users.login);
router.get("/get-users", Auth, Users.getUsers);
router.get(".get-all-users", Auth, Users.getAllUsers);
router.post("/add-contact", Auth, Users.AddContact);
router.get("/get-userDetails", Auth, Users.getUserDetails);

module.exports = router;
