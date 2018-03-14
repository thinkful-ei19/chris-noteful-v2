'use strict';
const knex = require('../knex');
const express = require('express');

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

  knex
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .modify(function(queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function(queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .orderBy('notes.id')
    .then((results) => res.json(results))
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
    .select('notes.id', 'title', 'content', 'folders.id as folderId', 'folders.name as folderName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
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
  
  knex('notes')
    .where({id: noteId})
    .update({
        title: req.body.title,
        content: req.body.content,
        folder_id: req.body.folder_id
    }, ['id', 'title', 'content', 'folder_id'])
    .then(() => {
      return knex
        .select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId)
    })
    .then((results) => res.location(`${req.originalUrl}/${results.id}`).status(201).json(results))
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
  const { title, content, folder_id } = req.body;
  
  const newItem = { title, content, folder_id };

  // const newItem = {
  //   title: title,
  //   content: content,
  //   folder_id: folder_id  // Add `folder_id`
  // };

  let noteId;

  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  // knex
  //   .insert(newItem)
  //   .into('notes')
  //   .returning('id')
  //   .then(([id]) => {
  //     noteId = id;
  //     return 
  //     knex
  //       .select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
  //       .from('notes')
  //       .leftJoin('folders', 'notes.folder_id', 'folders.id')
  //       .where('notes.id', noteId);
  //   })
  //   //May need to come back to fix this.
  //   //.then((results) => res.location(`http://${req.headers.host}/notes/${results.id}`).status(201).json(results))
  //   .then((results) => res.location(`http://${req.originalUrl}/notes/${results.id}`).status(201).json(results))
  //   .catch(err => next(err));

  knex.insert(newItem)
  .into('notes')
  .returning('id')
  .then(([id]) => {
    noteId = id;
    // Using the new id, select the new note and the folder
    return knex.select('notes.id', 'title', 'content', 'folder_id', 'folders.name as folder_name')
      .from('notes')
      .leftJoin('folders', 'notes.folder_id', 'folders.id')
      .where('notes.id', noteId);
  })
  .then(([result]) => {
    res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
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