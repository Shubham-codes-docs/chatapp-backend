const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const groupSchema = new Schema(
  {
    name: {
      type: String,

      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    info: {
      type: String,
      required: false,
      default: "Hey there! I am using chatApp",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Groups", groupSchema);
