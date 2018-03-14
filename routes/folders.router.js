const express = require('express');
const knex = require('../knex');
const router = express.Router();


//Get folders
router.get('/folders', (req, res, next) => {
    knex
        .select('id', 'name')
        .from('folders')
        .then(results => {
            res.json(results);
        })
        .catch(err => next(err));
});

//Get folder by id
router.get('/folders/:id', (req, res, next) => {
    knex
        .select('id', 'name')
        .from('folders')
        .where('id', req.params.id)
        .then(results => {
            if(results) {
                res.json(results);
            } else {
                next();
            }
        })
        .catch(err => next(err));
});

//Update Folder
router.put('/folders/:id', (req, res, next) => {

/***** Never trust users - validate input *****/
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
    console.log(req.body.name);
    knex('folders')
        .where({id: req.params.id})
        .update({
            name: req.body.name
        }, ['id', 'name'])
        .then(results => res.json(results))
        .catch(err => next(err));
});

//Create Folder
router.post('/folders', (req, res, next) => {

  /***** Never trust users - validate input *****/
    if (!req.body.name) {
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
    }

    knex('folders')
        .insert({
            name: req.body.name
        })
        .returning(['id', 'name'])
        .then(results => res.location(`http://${req.headers.host}/notes/${results.id}`).status(201).json(results))
        .catch(next)
});

//Delete Folder
router.delete('/folders/:id', (req, res, next) => {
    knex('folders')
        .where({id: req.params.id})
        .del()
        .then(results => res.json(results))
        .catch(err => next(err));
})

module.exports = router;