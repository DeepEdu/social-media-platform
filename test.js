const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const uuid = require("uuid");

const app = require("./index");
const userSchema = require("./model/user");
const postSchema = require("./model/post");
const postUserSchema = require("./model/postUser");

chai.use(chaiHttp);

// Function for creating new User
async function createUser() {
  return userSchema.create({
    email: "dummyuser1@example.com",
    password: "user1password",
    username: "",
    followers: [],
    following: [],
  });
}
// Function for creating new Post
async function createPost() {
  return postSchema.create({
    postId: uuid.v4(),
    title: "Test Post 1 ",
    description: "Test Post Description",
    time: new Date(),
    comment: [],
    Likes: [],
  });
}
describe("/", () => {
  beforeEach(async () => {
    // Clearing the users collection before each test
    await userSchema.deleteMany();
    await postSchema.deleteMany();
    await postUserSchema.deleteMany();
  });

  describe("/ Authenticate User", () => {
    it('should return "Not Authorised: Email Not Registered" when email is not registered', (done) => {
      chai
        .request(app)
        .post("/api/authenticate")
        .send({ email: "dumer1@example.com", password: "user1password" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res)
            .to.have.property("text")
            .which.contains("Not Authorised: Email Not Registered");
          done(err);
        });
    });

    it("should return a valid JWT token when email is registered", async () => {
      const user = await createUser();

      const res = await chai
        .request(app)
        .post("/api/authenticate")
        .send({ email: user.email });

      expect(res).to.have.status(200);
      expect(res.body.token).to.be.a("string");

      // Verify that the token can be decoded using the JWT_SECRET_KEY
      const decodedToken = jwt.verify(
        res.body.token,
        process.env.JWT_SECRET_KEY
      );
      expect(decodedToken).to.have.property("id");
    });
  }, 10000);

  describe("/ Follow User ", () => {
    let newUser;
    let token;
    let testUser;
    // JWT Token Expire Test case
    it("should return error that JWT Token expires", async () => {
      // Register a new user
      newUser = await createUser();
      let userId = newUser._id;
      // Expired JWT Token
      const tokenWithDifferentId = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1s" }
      );
      const differentUserId = "6026df1571d3c648d84348d7";

      const res = await chai
        .request(app)
        .post(`/api/follow/${differentUserId}`)
        .set("x-access-token", tokenWithDifferentId);
      expect(res).to.have.status(400);
    });
    it('should return "400 User not found" if user is not in database', async () => {
      // Register a new user
      newUser = await createUser();
      let userId = newUser._id;
      const differentUserId = "6026df1571d3c648d84348d7";
      // New JWT token with a different user ID
      const tokenWithDifferentId = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET_KEY
      );

      const res = await chai
        .request(app)
        .post(`/api/follow/${differentUserId}`)
        .set("x-access-token", tokenWithDifferentId);
      expect(res).to.have.status(400);
      expect(res.text).to.equal("User not found");
    });

    it('should return "Successfully Followed user" if user is in db', async () => {
      // Register a new user
      newUser = await createUser();

      let userId = newUser._id;
      // Creating a Test user to be followed by the user
      testUser = await userSchema.create({
        email: "dummyuser2@example.com",
        password: "user2password",
        username: "testuser",
        followers: [],
        following: [],
      });
      let testUserId = newUser._id;
      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      const res = await chai
        .request(app)
        .post(`/api/follow/${testUserId}`)
        .set("x-access-token", token);
      expect(res).to.have.status(200);
      expect(res.text).to.equal("Successfully Followed user");
    });
  });

  describe("/ Unfollow User ", () => {
    let token;
    let userId;
    let followingId;

    it("should successfully unfollow the user", async () => {
      // Register a new user
      const userfollower = await createUser();
      // Register a new user which is followed by the first user
      const userfollowing = await userSchema.create({
        email: "dummyuser2@example.com",
        password: "user2password",
        username: "testuser",
        followers: [],
        following: [],
        username: "",
      });
      userId = userfollower._id;
      followingId = userfollowing._id;
      userfollower.following = followingId;
      userfollowing.followers = userId;
      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);
      const res = await chai
        .request(app)
        .post(`/api/unfollow/${followingId}`)
        .set("x-access-token", token);
      expect(res.text).to.equal("Successfully Unfollowed user");
      expect(res).to.have.status(200);

      // check that the follower's following list does not contain the user anymore
      const follower = await userSchema.findOne({ _id: followingId });
      expect(follower.followers).to.not.include(userId);

      // check that the user's followers list does not contain the follower anymore
      const user = await userSchema.findOne({ _id: userId });
      expect(user.following).to.not.include(followingId);
    });
  }, 10000);

  describe("/ User Profile", () => {
    let token;

    it("should return user profile", async () => {
      // Register new User
      const userfollower = await createUser();

      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);
      const res = await chai
        .request(app)
        .get("/api/user")
        .set("x-access-token", token);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("message").to.equal("User profile");
      expect(res.body).to.have.property("data");
      expect(res.body.data)
        .to.have.property("username")
        .to.equal(userfollower.username);
      expect(res.body.data)
        .to.have.property("followers")
        .to.equal(userfollower.followers.length);
      expect(res.body.data)
        .to.have.property("following")
        .to.equal(userfollower.following.length);
    });
  }, 10000);

  describe("/ User Add Post ", () => {
    let token;

    it("should create a new post when request is valid", async () => {
      // Register new User
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      // Generating new Post
      const post = {
        title: "Test Post Title",
        description: "Test Post Description",
      };

      chai
        .request(app)
        .post("/api/posts/")
        .set("x-access-token", token)
        .send(post)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("title").to.equal(post.title);

          expect(res.body)
            .to.have.property("description")
            .to.equal(post.description);
          expect(res.body).to.have.property("time");
        });
    });

    it("should return a 400 error if title or description is missing", async () => {
      // Register new User
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      // send no data in the request body
      chai
        .request(app)
        .post("/api/posts/")
        .set("x-access-token", token)
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.text).to.equal("Title and description are required");
        });
    });
  }, 10000);

  describe("/ User Delete Post ", () => {
    let token;

    it("should delete the post", async () => {
      // Create a new user that is authorized to delete the post
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      // Generate a new post for deleting
      const newPost = await createPost();
      const postId = newPost.postId;
      await postUserSchema.create({
        postId: postId,
        userId: userId,
      });
      const res = await chai
        .request(app)
        .delete(`/api/posts/${postId}`)
        .set("x-access-token", token);
      expect(res).to.have.status(201);
      expect(res)
        .to.have.property("text")
        .which.contains("Successfully Deleted The Post");
    });

    it("The post don't Exist", async () => {
      // Create a new user that is authorized to delete the post
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      const postId = "1234567890";
      await postUserSchema.create({
        postId: postId,
        userId: userId,
      });
      const res = await chai
        .request(app)
        .delete(`/api/posts/${postId}`)
        .set("x-access-token", token);
      expect(res).to.have.status(400);
      expect(res)
        .to.have.property("text")
        .which.contains("The post don't Exist");
    });

    it("Not Authorized To Delete the Post", async () => {
      // Create a new user that is not authorized to delete the post
      let userId = 12345678;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      // Generate new Post
      const newPost = await createPost();

      const postId = newPost.postId;
      await postUserSchema.create({
        postId: postId,
        userId: userId,
      });
      const res = await chai
        .request(app)
        .delete(`/api/posts/${postId}`)
        .set("x-access-token", token);
      expect(res).to.have.status(400);
      expect(res)
        .to.have.property("text")
        .which.contains("Not Authorized To Delete the Post");
    });
  }, 10000);

  describe("/ User Like Post ", () => {
    let token;
    it('should return status 201 and message "Successfully Liked The Post" when post exists', async () => {
      // Register new User
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      // Generate new Post
      const newPost = await createPost();
      const postId = newPost.postId;
      await postUserSchema.create({
        postId: postId,
        userId: userId,
      });

      const response = await chai
        .request(app)
        .post(`/api/like/${postId}`)
        .set("x-access-token", token);
      expect(response).to.have.status(201);
      expect(response)
        .to.have.property("text")
        .which.contains("Successfully Liked The Post");
    });
  }, 10000);

  describe("/ User Unlike Post ", () => {
    let token;
    it('should return status 201 and message "Successfully Unliked The Post" when post exists and is liked', async () => {
      // Register new User
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      // Generate new post
      const newPost = await createPost();
      const postId = newPost.postId;
      await postSchema.updateOne(
        { postId: postId },
        { $push: { Likes: userId } }
      );
      const response = await chai
        .request(app)
        .post(`/api/unlike/${postId}`)
        .set("x-access-token", token);
      expect(response).to.have.status(201);
      expect(response)
        .to.have.property("text")
        .which.contains("Successfully Unliked The Post");
    });
  }, 10000);

  describe("/ User comment on Post ", () => {
    let token;
    it("it should add a comment to a post", async () => {
      // Register new user
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      const newPost = await createPost();
      const postId = newPost.postId;
      await postUserSchema.create({
        postId: postId,
        userId: userId,
      });
      const comment = "Test comment";
      const response = await chai
        .request(app)
        .post(`/api/comment/${postId}`)
        .send({ comment })
        .set("x-access-token", token);
      expect(response).to.have.status(201);
      expect(response.body)
        .to.have.property("message")
        .to.equal("Comment added");
      expect(response.body).to.have.property("comment_ID");
    });
  }, 10000);

  describe("/ User Get Post by Id", () => {
    let token;
    it("it should return the number of likes and comments for a post", async () => {
      // Register new user
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      const newPost = await createPost();
      const postId = newPost.postId;
      await postUserSchema.create({
        postId: postId,
        userId: userId,
      });

      const response = await chai
        .request(app)
        .get(`/api/posts/${postId}`)
        .set("x-access-token", token);
      expect(response).to.have.status(201);
      expect(response.body).to.have.property("postId").eql(postId);
      expect(response.body).to.have.property("likes").be.a("number");
      expect(response.body).to.have.property("comment").be.a("number");
    });
  }, 10000);

  describe("/ User Get All Post ", () => {
    let token;
    it("should return an array of posts for a valid user", async () => {
      // Register new user
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      // Creating Two Post for one user
      const newPost1 = await createPost();
      const newPost2 = await createPost();
      const postId1 = newPost1.postId;
      const postId2 = newPost2.postId;

      // Updating in postUser collections
      await postUserSchema.create({
        postId: postId1,
        userId: userId,
      });
      await postUserSchema.create({
        postId: postId2,
        userId: userId,
      });

      const response = await chai
        .request(app)
        .get(`/api/all_posts/`)
        .set("x-access-token", token);
      expect(response).to.have.status(201);
      expect(response.body.allPost).to.be.an("array");
      expect(response.body.allPost.length).to.be.equal(2);
    });

    it("should return a 201 status for a user with zero posts", async () => {
      // Register new user
      const userfollower = await createUser();
      let userId = userfollower._id;

      // New JWT token with user ID
      token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY);

      const response = await chai
        .request(app)
        .get(`/api/all_posts/`)
        .set("x-access-token", token);
      expect(response).to.have.status(201);
      expect(response)
        .to.have.property("text")
        .which.contains("Zero Post are associated with this User:");
    });
  }, 10000);
});
