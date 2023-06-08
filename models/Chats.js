const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    content: {
      type: String,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    starred: {
      type: Boolean,
      default: false,
    },
    messageStatus: {
      type: String,
    },
    sentAt: {
      type: String,
    },
    deliveredAt: {
      type: String,
    },
    ReadAt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chats", chatSchema);
