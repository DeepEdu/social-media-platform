const express = require("express");
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
require("../model/.env");
const auth = require("../middleware/auth");

// Express route
const Route = express.Router();

// All schema
const postSchema = require("../model/post");
const postUserSchema = require("../model/postUser");
const userSchema = require("../model/user");

// Token
Route.route("/api/authenticate").post(async (req, res, next) => {
  const existingUser = await userSchema.findOne({ email: req.body.email });
  if (!existingUser) {
    return res.status(400).send("Not Authorised: Email Not Registered");
  } else {
    var access;
    // Create Token
    var token = jwt.sign({ id: existingUser.id }, JWT_SECRET_KEY, {
      expiresIn: "2h",
    });
    res.json(token);
  }
});

// POST /api/follow/{id} authenticated user would follow user with {id}
Route.route("/api/follow/:id").post(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const existingUser = await userSchema.findOne({ _id: req.params.id });
    console.log(existingUser + "asd");
    if (existingUser) {
      const updateFollowing = await userSchema.updateOne(
        { _id: decoded.id },
        { $addToSet: { following: req.params.id } }
      );

      const updateFollowers = await userSchema.updateOne(
        { _id: req.params.id },
        { $addToSet: { followers: decoded.id } }
      );

      return res.status(200).send("Successfully Followed user");
    } else {
      return res.status(400).send("User not found");
    }
  } catch (error) {
    return next(error);
  }
});

// POST /api/unfollow/{id} authenticated user would unfollow user with id
Route.route("/api/unfollow/:id").post(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const existingUser = await userSchema.findOne({ _id: req.params.id });

    if (existingUser) {
      const updateFollowing = await userSchema.updateOne(
        { _id: decoded.id },
        { $pull: { following: req.params.id } }
      );

      const updateFollowers = await userSchema.updateOne(
        { _id: req.params.id },
        { $pull: { followers: decoded.id } }
      );

      if (updateFollowing.nModified === 0 || updateFollowers.nModified === 0) {
        return res.status(400).send("Failed to Unfollow user");
      } else return res.status(200).send("Successfully Unfollowed user");
    } else {
      return res.status(400).send("User not found");
    }
  } catch (error) {
    return next(error);
  }
});

// GET /api/user should authenticate the request and return the respective user profile.
Route.route("/api/user").get(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const existingUser = await userSchema.findOne({ _id: decoded.id });

    if (existingUser) {
      const data = {
        username: existingUser.username,
        followers: existingUser.followers.length,
        following: existingUser.following.length,
      };
      res.status(201).json({
        success: true,
        message: "User profile",
        data: data,
      });
    } else {
      return res.status(400).send("User not found");
    }
  } catch (error) {
    return next(error);
  }
});

// POST api/posts/ would add a new post created by the authenticated user.
Route.route("/api/posts/").post(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const existingUser = await userSchema.findOne({ _id: decoded.id });
    var postId = uuid.v4();

    if (existingUser) {
      const newPost = await postSchema.create({
        postId: postId,
        title: req.body.title,
        description: req.body.description,
        time: new Date(),
        comment: [],
        Likes: [],
      });
      //Creating postId userId table
      postUserSchema.create({ postId: postId, userId: decoded.id });
      return res.status(201).json({
        title: newPost.title,
        description: newPost.description,
        time: newPost.time,
      });
    } else {
      return res.status(400).send("User not found");
    }
  } catch (error) {
    return next(error);
  }
});

// DELETE api/posts/{id} would delete post with {id} created by the authenticated user.
Route.route("/api/posts/:id").delete(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const authPost = await postSchema.findOne({
      postId: req.params.id,
    });
    // console.log("+++");
    if (authPost !== null) {
      const authUser = await postUserSchema.findOne({
        postId: req.params.id,
      });
      if (authUser.userId !== decoded.id) {
        return res.status(400).json("Not Authorized To Delete the Post");
      }
      await postSchema.findOneAndDelete({ postId: req.params.id });
      await postUserSchema.findOneAndDelete({
        postId: req.params.id,
        userId: decoded.id,
      });
      return res.status(201).json("Successfully Deleted The Post");
    } else {
      return res.status(400).json("The post don't Exist");
    }
  } catch (error) {
    return next(error);
  }
});

// POST /api/like/{id} would like the post with {id} by the authenticated user.
Route.route("/api/like/:id").post(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const authPost = await postSchema.findOne({
      postId: req.params.id,
    });
    if (authPost !== null) {
      await postSchema.updateOne(
        { postId: req.params.id },
        { $addToSet: { likes: decoded.id } }
      );
      return res.status(201).json("Successfully Liked The Post");
    } else {
      return res.json("Post Doesnot Exist");
    }
  } catch (error) {
    return next(error);
  }
});

// POST /api/unlike/{id} would unlike the post with {id} by the authenticated user.
Route.route("/api/unlike/:id").post(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const authUser = await postSchema.findOne({
      postId: req.params.id,
    });
    if (authUser !== null) {
      await postSchema.updateOne(
        { postId: req.params.id },
        { $pull: { likes: decoded.id } }
      );
      return res.status(201).json("Successfully Unliked The Post");
    } else {
      return res.json("Post Doesnot Exist");
    }
  } catch (error) {
    return next(error);
  }
});

// POST /api/comment/{id} add comment for post with {id} by the authenticated user.
Route.route("/api/comment/:id").post(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const post = await postSchema.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json("Post Doesn't Exist");
    }
    // const authUser = await postUserSchema.findOne({
    //   postId: req.params.id,
    // });
    // if (authUser !== null) {
    const newComment = {
      comment: req.body.comment,
      comment_ID: uuid.v4(),
    };
    post.comment = post.comment ?? [];
    post.comment.push(newComment);
    await post.save();
    const postUser = await postUserSchema.findOneAndUpdate(
      {
        postId: req.params.id,
        userId: decoded.id,
      },
      { commentId: newComment.comment_ID }
    );
    return res
      .status(201)
      .json({ message: "Comment added", comment_ID: newComment.comment_ID });
    // } else {
    //   return res.json("Post Doesnot Exist");
    // }
  } catch (error) {
    return next(error);
  }
});

// GET api/posts/{id} would return a single post with {id} populated with its number of likes and comments
Route.route("/api/posts/:id").get(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const post = await postSchema.findOne({ postId: req.params.id });
    if (!post) {
      return res.status(404).json("Post not found");
    }
    return res.status(201).json({
      postId: req.params.id,
      likes: post.likes.length,
      comment: post.comment.length,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/all_posts would return all posts created by authenticated user sorted by post time.
Route.route("/api/all_posts/").get(auth, async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decoded = jwt.decode(token);
    const allPostId = await postUserSchema.find({ userId: decoded.id });
    const allPost = [];
    for (let i = 0; i < allPostId.length; i++) {
      let post = await postSchema.find({ postId: allPostId[i].postId });
      console.log(post[0].postId);
      allPost.push({
        id: post[0].postId,
        title: post[0].title,
        desc: post[0].description,
        time: post[0].time,
        comment: post[0].comment.length,
        likes: post[0].likes.length,
      });
    }
    if (allPost.length === 0)
      return res.status(201).json("Zero Post are associated with this User:");
    return res.status(201).json({ allPost });
  } catch (error) {
    return next(error);
  }
});

module.exports = Route;
