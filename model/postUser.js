const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let postUserID = new Schema(
  {
    userId: {
      type: String,
    },
    postId: {
      type: String,
    },
    commentId: {
      type: String,
    },
  },
  {
    collection: "postUserID",
  }
);
module.exports = mongoose.model("postUserID", postUserID);
