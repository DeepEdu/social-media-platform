const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let post = new Schema(
  {
    postId: {
      type: String,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    time: {
      type: Date,
    },
    comment: [
      {
        comment: {
          type: String,
        },
        comment_ID: {
          type: String,
        },
      },
    ],
    likes: {
      type: Array,
      default: [],
    },
  },
  {
    collection: "post",
  }
);
module.exports = mongoose.model("post", post);
