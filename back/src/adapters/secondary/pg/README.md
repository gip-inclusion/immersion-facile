This directory contains the scripts to generate the initial version of immersion-db.

We use `node-pg-migrate` to handle database migrations : https://salsita.github.io/node-pg-migrate/

CAREFUL : A migration, once it has been run in deployed environnement should never be altered !
Instead, you need to create a new migration with the new changes.

# To create an evolution in the db schema:

1. Ensure that you have a `immersion-facile/.env` file containing at least the following environment variables:

   ```sh
   NODE_ENV=local
   REPOSITORIES=PG
   PG_URL="postgresql://immersion:pg_password@postgres:5432/immersion-db"
   # following is needed by node-pg-migrate (but it is the same as PG_URL)
   DATABASE_URL="postgresql://immersion:pg_password@postgres:5432/immersion-db"
   ```

2. Generate a new migration file :

   ```sh
   back$ npm run migrate create the-name-of-your-migration
   ```

3. Edit the created file

4. You can then :
   - run all migration which have never ran: `npm run migrate up`
   - rollback the last migration: `npm run migrate down`
   - rollback n last migration: `npm run migrate down 4` # or any number
   - redo n last migration : `npm run migrate redo 4` # or any number
   - (redo is equivalent to : `npm run migrate down 4; npm run migrate up;`)

# Testing schema changes locally

1. Ensure that you have a `immersion-facile/.env` file containing at least the following environment variables:

   ```sh
   NODE_ENV=local
   REPOSITORIES=PG
   PG_URL="postgresql://immersion:pg_password@postgres:5432/immersion-db"
   # following is needed by node-pg-migrate (but it is the same as PG_URL)
   DATABASE_URL="postgresql://immersion:pg_password@postgres:5432/immersion-db"
   ```

2. Purge any existing database and bring up the docker-compose setup:

   ```sh
   immersion-facile$ docker-compose down --volumes
   immersion-facile$ rm -rf docker-data
   immersion-facile$ docker-compose up --build
   ```

   The local frontend can be reached at http://localhost:80
   <!-- prettier-ignore -->
   The local adminer UI can be reached at http://localhost:80/__db__admin. To login, use the following parameters:

   - System: `PostgreSQL`
   - Server: `postgres:5432`
   - Username: `immersion`
   - Password: `pg_password`
   - Database: `immersion-db`

3. To bring up only postgres and adminer with postgres port, and then migrate:

   ```sh
      immersion-facile$ docker-compose -f docker-compose.resources.yml up --build
   ```

   Now in another terminal, you can connect to it, e.g. like so:

   ```sh
      immersion-facile$ cd back
      back$ npm run migrate up
   ```
