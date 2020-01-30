require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const errorHandler = require("./errorHandler");
const foldersRouter = require("./folders/folders-router");

const app = express();

const morganOption = NODE_ENV === "production" ? " tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

//TODO ADD API VALIDATOR

//TODO USE ROUTERS FOR FOLDER AND NOTES
app.use("/api/folders", foldersRouter);

app.use(errorHandler);

module.exports = app;
