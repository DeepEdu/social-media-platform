const userSchema = require("../model/user");
const usersdata = require("./userData");
const crypto = require("crypto");

function generateUserName(email, password) {
  const hash = crypto
    .createHash("sha256")
    .update(email + password)
    .digest("hex");
  return hash.substring(0, 8);
}
async function createUser() {
  try {
    for (let i = 0; i < usersdata.length; i++) {
      let Data = usersdata[i];
      console.log(Data.userName);
      // console.log("+++");
      const userName = generateUserName(Data.email, Data.password);
      Data.username = userName;
      // console.log(Data);
      const options = { maxTimeMS: 15000 };
      const existingUser = await userSchema.findOne(
        { email: Data.email },
        null,
        options
      );
      if (!existingUser) {
        // console.log("---");
        await userSchema.create(Data);
      }
    }
    return { message: "Successfully added users to the DB" };
  } catch (error) {
    console.error(error);
  }
}

module.exports = createUser;
