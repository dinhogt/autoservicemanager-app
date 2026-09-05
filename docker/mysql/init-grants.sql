-- Grant full privileges on the app database so Prisma migrate (shadow DB) can
-- run CREATE INDEX, ALTER TABLE, and other DDL statements.
GRANT ALL PRIVILEGES ON `autoservicemanager`.* TO 'app'@'%';
GRANT ALL PRIVILEGES ON `autoservicemanager_shadow`.* TO 'app'@'%';
FLUSH PRIVILEGES;
