const Group = require("../models/Group");
const Users = require("../models/User");

exports.createGroup = async (req, res, next) => {
  if (!req.isAuth) {
    const err = new Error("Authentication failed");
    err.status = 402;
    throw err;
  }

  const { groupName, groupDescription, members, avatar } = req.body.group;
  const participants = [...members, req.userId];

  try {
    const newGroup = new Group({
      name: groupName,
      avatar: avatar || "",
      participants,
      admins: [req.userId],
      info: groupDescription,
    });
    const createdGroup = await newGroup.save();

    await Users.updateMany(
      { _id: { $in: participants } },
      { $push: { groups: createdGroup._id } }
    );

    res.status(201).json({ msg: "Group created successfully", success: 1 });
  } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
  }
};

exports.addToGroup = async (req, res, next) => {
  try {
    if (!req.isAuth) {
      const err = new Error("Authentication failed");
      err.status = 402;
      throw err;
    }

    const { contacts } = req.body;
  } catch (err) {
    next(err);
  }
};
