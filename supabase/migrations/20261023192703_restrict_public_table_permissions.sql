
-- Remove unnecessary TRUNCATE permissions
-- without affecting normal member CRUD operations.

REVOKE TRUNCATE
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;