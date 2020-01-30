const express = require("express");
const path = require("path");
const xss = require("xss");
const FoldersService = require("./folders-service");
const logger = require("../logger");

const foldersRouter = express.Router();
const jsonParser = express.json();

sanitizedFolder = folder => ({
  id: folder.id,
  name: xss(folder.name)
});

foldersRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    FoldersService.getAllFolders(knexInstance)
      .then(folders => {
        res.json(folders.map(sanitizedFolder));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name } = req.body;
    const knexInstance = req.app.get("db");

    //validation may need refactoring if more required fields are added into the folder
    if (!name) {
      logger.error("Missing Parameter in request body");
      return res.status(400).json({
        error: { message: `Need name of folder in request body` }
      });
    }

    const newFolder = { name };
    FoldersService.insertFolders(knexInstance, newFolder)
      .then(folder => {
        logger.info(`Folder with id ${folder.id} succesfully created`);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(sanitizedFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route("/:folder_id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { folder_id } = req.params;
    FoldersService.getById(knexInstance, folder_id)
      .then(folder => {
        if (!folder) {
          logger.error("No folder with the given id");
          return res.status(404).json({
            error: { message: `Folder does not exist` }
          });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizedFolder(res.folder));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { folder_id } = req.params;
    FoldersService.deleteFolders(knexInstance, folder_id)
      .then(() => {
        logger.info(`Folder with id ${folder_id} succesfully deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name } = req.body;
    const knexInstance = req.app.get("db");
    const { folder_id } = req.params;
    const folderToUpdate = { name };

    const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      logger.error("Request is missing a required field");
      return res.status(400).json({
        error: {
          message: `Request body must contain a name` //may refactor error message when more required field is added
        }
      });
    }
    FoldersService.updateFolders(knexInstance, folder_id, folderToUpdate)
      .then(() => {
        logger.info(`Folder with id ${folder_id} succesfully updated`);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;
