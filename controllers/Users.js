const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const socket = require("../utils/socket");

const io = socket.getIO();

exports.AddUsers = async (req, res, next) => {
  const { name, phone, password, avatar } = req.body;
  try {
    const user = await User.findOne({ phone: phone });
    console.log(user);
    if (user) {
      const err = new Error("User with the given number already exists!");
      err.status = 202;
      throw err;
    }
    let pass = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      phone,
      avatar: avatar ? avatar : "",
      password: pass,
      contacts: [],
      status: "",
    });
    await newUser.save();
    return res.json({ code: 200, msg: "User Created" });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone: phone });
  try {
    if (!user) {
      const err = new Error("User not found!");
      err.status = 404;
      throw err;
    }
    let result = await bcrypt.compare(password, user.password);
    if (result) {
      const token = jwt.sign(
        {
          user_id: user._id.toString(),
        },
        "SuperStrongSecretnooneCancrackbecauseitissoRandom"
      );
      return res.json({
        token,
        id: user._id,
      });
    } else {
      const err = new Error("Passwords do not match");
      err.status = 404;
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    if (!req.isAuth) {
      const err = new Error("Authentication failed");
      err.status = 202;
      throw err;
    }
    const users = await User.find({
      _id: { $nin: [mongoose.Types.ObjectId(req.userId)] },
    });

    if (io) {
      io.on("check", (socket) => {
        console.log(socket.id);
      });
    }

    res.json({ status: 200, users });
  } catch (err) {
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    if (!req.isAuth) {
      const err = new Error("Authentication failed");
      err.status = 202;
      throw err;
    }

    const users = await User.find();

    res.json({ status: 200, users });
  } catch (err) {
    next(err);
  }
};

exports.AddContact = async (req, res, next) => {
  try {
    if (!req.isAuth) {
      const err = new Error("Authentication failed");
      err.statusCode = 202;
      throw err;
    }

    const { contact } = req.body;

    const user = await User.findById(req.userId);

    let findContact = user.contacts.findIndex((data) => {
      return data.toString() === contact._id.toString();
    });

    if (findContact !== -1) {
      res.status(200).json({ msg: "User already exists!", status: 0 });
    } else {
      user.contacts.push(contact);
      await user.save();
      res.status(200).json({ msg: "User added successfully", status: 1 });
    }
  } catch (err) {
    next(err);
  }
};

exports.getUserDetails = async (req, res, next) => {
  try {
    if (!req.isAuth) {
      const err = new Error("Authentication failed");
      err.statusCode = 202;
      throw err;
    }
    const user = await User.findById(req.userId)
      .populate("contacts")
      .populate("groups");
    if (!user) {
      const err = new Error("No user found!");
      err.statusCode = 404;
      return next(err);
    } else {
      res.status(200).json({ user, status: 1 });
    }
  } catch (err) {
    next(err);
  }
};

exports.getUserSocketId = async (req, res, next) => {
  try {
    if (!req.isAuth) {
      const err = new Error("Authentication failed");
      err.statusCode = 202;
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
