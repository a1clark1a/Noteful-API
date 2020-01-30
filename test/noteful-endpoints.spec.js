const knex = require("knex");
const app = require("../src/app");
const { makeFoldersArray, makeMaliciousFolder } = require("./folders.fixtures");

describe("Folders endpoints", () => {
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

  describe("GET /api/folders", () => {
    context("Given no bookmarks", () => {
      it("responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/folders")
          .expect(200, []);
      });
    });

    context("Given there are folders in the database", () => {
      const testFolders = makeFoldersArray();

      beforeEach("Insert folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it("responds with 200 and all of the folders", () => {
        return supertest(app)
          .get("/api/folders")
          .expect(200, testFolders);
      });
    });

    context("Given an xss attack folder", () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

      beforeEach("Insert malicious folder", () => {
        return db.into("noteful_folders").insert([maliciousFolder]);
      });

      it("removes xss attack script", () => {
        return supertest(app)
          .get("/api/folders")
          .expect(200)
          .expect(res => {
            expect(res.body[0].name).to.eql(expectedFolder.name);
          });
      });
    });
  });

  describe("GET /api/folders/:folders_id", () => {
    context(`Given no folders`, () => {
      it("responds with a 404", () => {
        return supertest(app)
          .get("/api/folders/12345")
          .expect(404, {
            error: { message: `Folder does not exist` }
          });
      });
    });

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray();

      beforeEach("Insert folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it(`GET /api/folders/:folder_id responds with 200 and the specified folder`, () => {
        const idToGet = 2;
        const expectedFolder = testFolders[idToGet - 1];
        return supertest(app)
          .get(`/api/folders/${idToGet}`)
          .expect(200, expectedFolder);
      });
    });

    context(`Given an xss attack folder`, () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

      beforeEach("Insert malicious folder", () => {
        return db.into("noteful_folders").insert([maliciousFolder]);
      });

      it("removes xss attack script", () => {
        return supertest(app)
          .get(`/api/folders/${maliciousFolder.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.name).to.eql(expectedFolder.name);
          });
      });
    });
  });

  describe(`POST /api/folders`, () => {
    it("creates a folder responding with a 201 and the new folder", () => {
      const newFolder = {
        name: "TESTING THE POST"
      };

      return supertest(app)
        .post("/api/folders")
        .send(newFolder)
        .expect(201)
        .expect(res => {
          expect(res.body.name).to.eql(newFolder.name);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
        })
        .then(postRes => {
          supertest(app)
            .get(`/api/folders/${postRes.body.id}`)
            .expect(postRes.body);
        });
    });

    const requiredFields = ["name"];

    requiredFields.forEach(field => {
      const newFolder = {
        name: "GONNA REMOVE ME"
      };

      it(`responds with a 400 and an error message when the '${field}' is not supplied`, () => {
        delete newFolder[field];

        return supertest(app)
          .post(`/api/folders`)
          .send(newFolder)
          .expect(400, {
            error: { message: `Need ${field} of folder in request body` }
          });
      });
    });

    context(`Given an xss attack folder`, () => {
      const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

      it(`removes xss attack script`, () => {
        return supertest(app)
          .post(`/api/folders`)
          .send(maliciousFolder)
          .expect(201)
          .expect(res => {
            expect(res.body.name).to.eql(expectedFolder.name);
          });
      });
    });
  });

  describe(`DELETE /api/folders`, () => {
    context(`Given no folders`, () => {
      it("responds with a 404", () => {
        return supertest(app)
          .delete(`/api/folders/12324`)
          .expect(404, { error: { message: `Folder does not exist` } });
      });
    });

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray();

      beforeEach("Insert folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it("responds with a 204 and removes the article", () => {
        const idToRemove = 2;
        const remainingFolders = testFolders.filter(
          folder => folder.id !== idToRemove
        );

        return supertest(app)
          .delete(`/api/folders/${idToRemove}`)
          .expect(204)
          .then(res => {
            supertest(app)
              .get("/api/folders")
              .expect(remainingFolders);
          });
      });
    });
  });

  describe(`PATCH /api/folders/:folder_id`, () => {
    context(`Given no folders`, () => {
      it("responds with a 404", () => {
        return supertest(app)
          .patch("/api/folders/12345")
          .expect(404, { error: { message: `Folder does not exist` } });
      });
    });

    context(`Given there are folders in the database`, () => {
      const testFolders = makeFoldersArray();

      beforeEach("Insert folders", () => {
        return db.into("noteful_folders").insert(testFolders);
      });

      it("responds with a 204 and updates the specified folder", () => {
        const idToUpdate = 2;
        const updateFolder = {
          name: "UPDATED NAME OF FOLDER"
        };
        const expectedFolder = {
          ...testFolders[idToUpdate - 1],
          ...updateFolder
        };

        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send(updateFolder)
          .expect(204)
          .then(res => {
            return supertest(app)
              .get(`/api/folders/${idToUpdate}`)
              .expect(expectedFolder);
          });
      });

      it(`responds with a 400 when no required fields are supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/folders/${idToUpdate}`)
          .send({
            irrelevantField: "fail"
          })
          .expect(400, {
            error: { message: `Request body must contain a name` }
          });
      });
    });
  });
});
