# NOTEFUL-SERVER API

## LIVE APP

- Noteful-Client = https://a1clark1a-noteful-client.now.sh/

- Noteful-Serve =

## Summary

- A Node.js and Express server API that handles CRUD request from Noteful-Client project. Utilizes RESTful api architecture, mocha, chai and supertest endpoints testing and validation, XSS cross-site scripting sanitation, and PostgreSQL and Knex for database management.

## TECH STACK

- Node.js
- Express
- Mocha, Chai and Supertest
- Postgresql
- morgan and winston logger
- Knex
- XSS

## API-ENDPOINTS

### Folders

- `/GET /api/folders`

- `/GET /api/folders/:folders_id`

- `/POST /api/folders/` - Request body needs a "name" parameter

- `/DELETE /api/folders/:folders_id`

- `/PATCH /api/folders/:folders_id` Request body takes a "name"

### Notes

- `/GET /api/notes`

- `/GET /api/notes/:notes_id`

- `/POST /api/notes/` - Request body needs a ["name", "folders_id"] parameter as required and "content" for not required

- `/DELETE /api/notes/:notes_id`

- `/PATCH /api/notes/:notes_id` Request body takes a ["name", "content", "folders_id"]

# Express Boilerplate!

This is a boilerplate project used for starting new projects!

## Set up

Complete the following steps to start a new project (NEW-PROJECT-NAME):

1. Clone this repository to your local machine `git clone BOILERPLATE-URL NEW-PROJECTS-NAME`
2. `cd` into the cloned repository
3. Make a fresh start of the git history for this project with `rm -rf .git && git init`
4. Install the node dependencies `npm install`
5. Move the example Environment file to `.env` that will be ignored by git and read by the express server `mv example.env .env`
6. Edit the contents of the `package.json` to use NEW-PROJECT-NAME instead of `"name": "express-boilerplate",`

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

When your new project is ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.
