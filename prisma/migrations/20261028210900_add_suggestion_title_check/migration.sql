-- This is an empty migration.

ALTER TABLE "Suggestion"
ADD CONSTRAINT "Suggestion_title_check"
CHECK (
  char_length("title") BETWEEN 3 AND 120
  AND "title" = btrim("title")
);
