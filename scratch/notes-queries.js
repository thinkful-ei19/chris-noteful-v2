const knex = require('../knex');
console.log('firing~')
// knex.select(1).then(res => console.log(res));

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

// knex
//   .select()
//   .from('notes')
//   .then(res => console.log(res))

// Get All (and search by query)
/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
    const { searchTerm } = req.query;
    knex
    .select('id', 'title', 'content')
    .from('notes')
     .where(function() {
        if (searchTerm) {
            this.where('title', 'like', `%${searchTerm}%`);
        }
     })
    .then(results => console.log(results))
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
        .select('id', 'title', 'content')
        .from('notes')
        .where('id', noteId)
        .then(results => console.log(results))
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
    const updateObj = {};
    const updateableFields = ['title', 'content'];

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
            content: req.body.content
        }, ['id', 'title', 'content'])
        .then(results => console.log(results))
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
    const { title, content } = req.body;
    
    const newItem = { title, content };
    /***** Never trust users - validate input *****/
    if (!newItem.title) {
      const err = new Error('Missing `title` in request body');
      err.status = 400;
      return next(err);
    }

    knex('notes')
        .insert(newItem)
        .returning(['id', 'title', 'content'])
        .then(res => console.log(res));
  
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
    const notesId = req.params.id;
    
    knex('notes')
        .where({id: notesId})
        .del()
        .then(results => console.log(results))
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