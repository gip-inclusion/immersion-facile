ALTER TABLE searches_made
DROP CONSTRAINT PK_searches_made;

ALTER TABLE searches_made
ADD id uuid NOT NULL PRIMARY KEY; 