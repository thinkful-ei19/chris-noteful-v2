SELECT * FROM notes;
SELECT * FROM notes LIMIT 5;
SELECT * FROM notes ORDER BY id ASC;
SELECT * FROM notes ORDER BY id DESC;
SELECT * FROM notes WHERE title='string';
SELECT * FROM notes where title LIKE 'string';

INSERT INTO notes
(id, title, content) VALUES
(id, title, content);

DELETE FROM notes WHERE id='id';
