require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const errorHandler = require("./errorHandler");

const app = express();

const morganOption = NODE_ENV === "production" ? " tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

//TODO ADD API VALIDATOR

//TODO USE ROUTERS FOR FOLDER AND NOTES

app.use(errorHandler);

module.exports = app;
