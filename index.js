const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const Route = require("./route/routes");
app.use(cors());
app.use(express.json());
app.use("/", Route);
require("dotenv").config();

let createUser = require("./setup/importUserData");
console.log(process.env.MONGODB_URL);
console.log("---");
mongoose
  .connect(process.env.MONGODB_URL)
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name:: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err);
  });

createUser();
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Listening on port " + port);
});

module.exports = app; // for testing
