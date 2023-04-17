const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const Route = require("./route/routes");
app.use(cors());
app.use(express.json());
app.use("/", Route);

let createUser = require("./setup/importUserData");

require("./model/.env");

mongoose
  .connect(MONGODB_URL)
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name:: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err.reason);
  });

createUser();
const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Listening on port " + port);
});

module.exports = app; // for testing
