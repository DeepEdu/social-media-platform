const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let users = new Schema(
  {
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    username: {
      type: String,
    },
    followers: {
      type: Array,
      default: [],
    },
    following: {
      type: Array,
      default: [],
    },
  },
  {
    collection: "users",
  }
);
module.exports = mongoose.model("users", users);
