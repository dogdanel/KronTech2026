-- App services use these (see docker-compose DATABASE_URL per service):
CREATE DATABASE auth_db;
CREATE DATABASE parking_db;
CREATE DATABASE booking_db;
-- Some clients default the database name to the DB user ("parkshare"); create it to avoid
-- FATAL: database "parkshare" does not exist when using GUI tools or URLs without a DB name.
CREATE DATABASE parkshare;
