const knex = require("knex");
const express = require("express");
const path = require("path");
const xss = require("xss");
const logger = require("../logger");
const NotesService = require("./notes-service");

const notesRouter = express.Router();
const jsonParser = express.json();

const sanitizedNotes = notes => ({
  id: notes.id,
  name: xss(notes.name),
  modified: new Date(notes.modified),
  folders_id: notes.folders_id,
  content: xss(notes.content)
});

notesRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    NotesService.getAllNotes(knexInstance)
      .then(notes => {
        res.json(notes.map(sanitizedNotes));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name, folders_id, content } = req.body;
    const newNote = { name, folders_id };
    const knexInstance = req.app.get("db");

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        logger.error(`Missing ${key} request body`);
        return res.status(400).json({
          error: { message: `'${key}' is required in request body` }
        });
      }
    }

    newNote.content = content;
    NotesService.insertNote(knexInstance, newNote)
      .then(notes => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${notes.id}`))
          .json(sanitizedNotes(newNote));
      })
      .catch(next);
  });

notesRouter
  .route("/:notes_id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { notes_id } = req.params;
    NotesService.getById(knexInstance, notes_id)
      .then(notes => {
        if (!notes) {
          logger.error("No notes with the given id");
          return res.status(404).json({
            error: { message: `Notes does not exist` }
          });
        }
        res.notes = notes;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizedNotes(res.notes));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    const { notes_id } = req.params;
    NotesService.deleteNote(knexInstance, notes_id)
      .then(() => {
        logger.info(`Note with id ${notes_id} succesfully deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, folders_id, content } = req.body;
    const notesToUpdate = { name, folders_id, content };
    const knexInstance = req.app.get("db");
    const { notes_id } = req.params;

    const numberOfValues = Object.values(notesToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      logger.error("Patch Request is missing a required field");
      return res.status(400).json({
        error: {
          message: `Request body must contain either a name, folders_id or content `
        }
      });
    }
    NotesService.updateNote(knexInstance, notes_id, notesToUpdate)
      .then(() => {
        logger.info(`Notes with id ${notes_id} succesfully updated`);
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
