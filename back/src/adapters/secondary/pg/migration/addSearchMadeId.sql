ALTER TABLE  public.searches_made
DROP CONSTRAINT PK_searches_made;

ALTER TABLE  public.searches_made
ADD id uuid NOT NULL PRIMARY KEY; 