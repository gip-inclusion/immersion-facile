ALTER TABLE  public.searches_made
DROP CONSTRAINT IF EXISTS pk_searches_made;

ALTER TABLE  public.searches_made
ADD id uuid NOT NULL PRIMARY KEY; 