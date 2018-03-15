'use strict';
const knex = require('../knex');
const express = require('express');
const hydrateNotes = require('../utils/hydrateNotes');
// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
/* 
const data = require('../db/notes');
const simDB = require('../db/simDB');
const notes = simDB.initialize(data);
*/

// Get All (and search by query)
/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm } = req.query;
  const folderId = req.query.folderId;
  const tagId = req.query.tagId;
  knex
    .select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folder_name', 'tags.name as tagName', 'tags.id as tagId')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .modify(function(queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function(queryBuilder) {
      if (folderId) {
        queryBuilder.where('folders.id', folderId);
      }
      if (tagId) {
        queryBuilder.where('tags.id', tagId);
      }
    })
    .orderBy('notes.id')
    .then((results) => {
      if (results) {
        const hydrated = hydrateNotes(results);
        res.json(hydrated);
      } else {
        next();
      }
    })
    //.then((results) => res.json(results))
    .catch(err => next(err));
  /* 
  notes.filter(searchTerm)
    .then(list => {
      res.json(list);
    })
    .catch(err => next(err)); 
  */
});


/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folder_name', 'tags.name as tagName', 'tags.id as tagId')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where('notes.id', noteId)
    .then(([results]) => res.json(results))
    .catch(err => next(err));

  /*
  notes.find(noteId)
    .then(item => {
      if (item) {
        res.json(item);
      } else {
        next();
      }
    })
    .catch(err => next(err));
  */
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { title, content, folder_id, tags=[] } = req.body;
  const noteId = req.params.id;
  /***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['title', 'content', 'folder_id'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!updateObj.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  const updatedItem = { title, content, folder_id }
  knex('notes')
    .where({id: noteId})
    .update(updatedItem)
    .then(() => {
      return knex
        .del()
        .from('notes_tags')
        .where('note_id', noteId)
    })
    .then(() => {
      const newTags = tags.map(nt => ({note_id: noteId, tag_id: nt}));
      return knex.insert(newTags).into('notes_tags');
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName', 'tags.id as tagId', 'tags.name as tagName')
    .from('notes') 
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .where('notes.id', noteId)
    })
    .then((results) => {
      if (results) {
        const [hydrated] = hydrateNotes(results);
        res.json(hydrated);
      }
      else {
        next();
      }
    })
    .catch(err => next(err));

  /*
  notes.update(noteId, updateObj)
    .then(item => {
      if (item) {
        res.json(item);
      } else {
        next();
      }
    })
    .catch(err => next(err));
  */
});

/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id, tags } = req.body;
  
  const newItem = { title, content, folder_id };
  console.log(newItem);

  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  let noteId;
  // Insert new note into notes table
  knex('notes')
  .insert(newItem).returning('id')
    .then(([id]) => {
      console.log(id);
      // Insert related tags into notes_tags table
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Select the new note and leftJoin on folders and tags
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        // Hydrate the results
        const hydrated = hydrateNotes(result)[0];
        // Respond with a location header, a 201 status and a note object
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
  /*
  notes.create(newItem)
    .then(item => {
      if (item) {
        res.location(`http://${req.headers.host}/notes/${item.id}`).status(201).json(item);
      } 
    })
    .catch(err => next(err));
  */
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  
  knex('notes')
    .where({id: noteId})
    .del()
    .then((results) => res.json(results))
    .catch(err => next(err));

  /*
  notes.delete(id)
    .then(count => {
      if (count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => next(err));
  */
});

module.exports = router;
//api/notes