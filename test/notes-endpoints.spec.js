const knex = require("knex");
const app = require("../src/app");
const { makeFoldersArray, makeMaliciousFolder } = require("./folders.fixtures");
const {
  makeNotesArray,
  makeExpectedNotesArray,
  makeMaliciousNotes
} = require("./notes.fixtures");

describe("Notes endpoints", () => {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });

    app.set("db", db);
  });

  after("disconnect from the db", () => db.destroy());

  before("clean the table", () =>
    db.raw("TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE")
  );

  afterEach("cleanup", () =>
    db.raw("TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE")
  );

  describe("GET /api/notes", () => {
    context("Given no notes", () => {
      it("responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/notes")
          .expect(200, []);
      });
    });

    context("Given there are notes in the database", () => {
      const testNotes = makeNotesArray();
      const testFolders = makeFoldersArray();
      const expectedNotesArray = makeExpectedNotesArray();

      beforeEach("Insert folders then the notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it("responds with 200 and all of the notes", () => {
        return supertest(app)
          .get("/api/notes")
          .expect(200, expectedNotesArray);
      });
    });

    context("Given an xss attack notes", () => {
      const { maliciousNotes, expectedNotes } = makeMaliciousNotes();
      const testFolders = makeFoldersArray();

      beforeEach("Insert folders then malicious notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert([maliciousNotes]);
          });
      });

      it("removes xss attack script", () => {
        return supertest(app)
          .get("/api/notes")
          .expect(200)
          .expect(res => {
            expect(res.body[0].name).to.eql(expectedNotes.name);
            expect(res.body[0].content).to.eql(expectedNotes.content);
          });
      });
    });
  });

  describe("GET /api/notes/:notes_id", () => {
    context(`Given no notes`, () => {
      it("responds with a 404", () => {
        return supertest(app)
          .get("/api/notes/12345")
          .expect(404, {
            error: { message: `Notes does not exist` }
          });
      });
    });

    context(`Given there are notes in the database`, () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();
      const expectedNotes = makeExpectedNotesArray();

      beforeEach("Insert folders then the notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it(`GET /api/notes/:notes_id responds with 200 and the specified notes`, () => {
        const idToGet = 2;
        const indexedNote = expectedNotes[idToGet - 1];
        return supertest(app)
          .get(`/api/notes/${idToGet}`)
          .expect(200, indexedNote);
      });
    });

    context(`Given an xss attack notes`, () => {
      const { maliciousNotes, expectedNotes } = makeMaliciousNotes();
      const testFolders = makeFoldersArray();

      beforeEach("Insert folders then malicious notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert([maliciousNotes]);
          });
      });

      it("removes xss attack script", () => {
        return supertest(app)
          .get(`/api/notes/${maliciousNotes.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedNotes.name);
            expect(res.body.content).to.eql(expectedNotes.content);
          });
      });
    });
  });

  describe(`POST /api/notes`, () => {
    const testFolders = makeFoldersArray();

    beforeEach("Insert folders", () => {
      return db.into("noteful_folders").insert(testFolders);
    });

    it("creates a note responding with a 201 and the new note", function() {
      this.retries(3);
      const newNote = {
        name: "TESTING THE NOTE",
        folders_id: 2,
        content: "Some test content"
      };

      return supertest(app)
        .post("/api/notes")
        .send(newNote)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newNote.name);
          expect(res.body.folders_id).to.eql(newNote.folders_id);
          expect(res.body.content).to.eql(newNote.content);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`);
          const expectedDate = new Date().toLocaleDateString("en", {
            timeZone: "UTC"
          });
          const actualDate = new Date(res.body.modified).toLocaleDateString();
          expect(actualDate).to.eql(expectedDate);
        })
        .then(postRes => {
          supertest(app)
            .get(`/api/notes/${postRes.body.id}`)
            .expect(postRes.body);
        });
    });

    const requiredFields = ["name", "folders_id"];

    requiredFields.forEach(field => {
      const newNotes = {
        name: "GONNA REMOVE ME",
        folders_id: 1
      };

      it(`responds with a 400 and an error message when the '${field}' is not supplied`, () => {
        delete newNotes[field];

        return supertest(app)
          .post(`/api/notes`)
          .send(newNotes)
          .expect(400, {
            error: { message: `'${field}' is required in request body` }
          });
      });
    });

    context(`Given an xss attack notes`, () => {
      const { maliciousNotes, expectedNotes } = makeMaliciousNotes();

      it(`removes xss attack script`, () => {
        return supertest(app)
          .post(`/api/notes`)
          .send(maliciousNotes)
          .expect(201)
          .expect(res => {
            expect(res.body.name).to.eql(expectedNotes.name);
            expect(res.body.content).to.eql(expectedNotes.content);
          });
      });
    });
  });

  describe(`DELETE /api/notes`, () => {
    context(`Given no notes`, () => {
      it("responds with a 404", () => {
        return supertest(app)
          .delete(`/api/notes/12324`)
          .expect(404, { error: { message: `Notes does not exist` } });
      });
    });

    context(`Given there are notes in the database`, () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();
      const expectedNotes = makeExpectedNotesArray();

      beforeEach("Insert folders then notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it("responds with a 204 and removes the note", () => {
        const idToRemove = 2;
        const remainingNotes = expectedNotes.filter(
          folder => folder.id !== idToRemove
        );

        return supertest(app)
          .delete(`/api/notes/${idToRemove}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get("/api/notes")
              .expect(remainingNotes);
          });
      });
    });
  });

  describe(`PATCH /api/notes/:notes_id`, () => {
    context(`Given no notes`, () => {
      it("responds with a 404", () => {
        return supertest(app)
          .patch("/api/notes/12345")
          .expect(404, { error: { message: `Notes does not exist` } });
      });
    });

    context(`Given there are notes in the database`, () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();
      const expectedNotes = makeExpectedNotesArray();

      beforeEach("Insert folders then notes", () => {
        return db
          .into("noteful_folders")
          .insert(testFolders)
          .then(() => {
            return db.into("noteful_notes").insert(testNotes);
          });
      });

      it("responds with a 204 and updates the specified note", () => {
        const idToUpdate = 2;
        const updateNote = {
          name: "UPDATED NAME OF NOTE",
          folders_id: 1,
          content: "Changing things up"
        };
        const updatedExpectedNote = {
          ...expectedNotes[idToUpdate - 1],
          ...updateNote
        };

        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send(updateNote)
          .expect(204)
          .then(res => {
            return supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .expect(updatedExpectedNote);
          });
      });

      it(`responds with a 400 when no required fields are supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({
            irrelevantField: "fail"
          })
          .expect(400, {
            error: {
              message: `Request body must contain either a name, folders_id or content `
            }
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateNote = {
          name: "UPDATED NAME OF NOTE"
        };
        const updatedExpectedNote = {
          ...expectedNotes[idToUpdate - 1],
          ...updateNote
        };
        return supertest(app)
          .patch(`/api/notes/${idToUpdate}`)
          .send({
            ...updateNote,
            fieldToIgnore: "should not be posted"
          })
          .expect(204)
          .then(res => {
            supertest(app)
              .get(`/api/notes/${idToUpdate}`)
              .expect(updatedExpectedNote);
          });
      });
    });
  });
});
