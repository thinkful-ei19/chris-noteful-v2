const knex = require('../knex');
const express = require('express');
const router = express.Router();

//Get
router.get('/tags', (req, res, next) => {

    knex
        .select()
        .from('tags')
        .then((results) => res.json(results))
        .catch(err => next(err));

});

//Get By Id

router.get('/tags/:id', (req, res, next) => {

    const tagId = req.params.id;

    knex
        .select()
        .from('tags')
        .where({id: tagId})
        .then((results) => res.json(results))
        .catch(err => next(err));

});

//Post
router.post('/tags', (req, res, next) => {
    const name = req.body[0].name;

    if(!name) {
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
    }

    const newItem = { name };

    knex.insert(newItem)
        .into('tags')
        .returning(['id', 'name'])
        .then((results) => {
            const result = results[0];
            res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
        })
        .catch(err => next(err));
});

//Put

router.put('/tags/:id', (req, res, next) => {
    const tagId = req.params.id;

    knex
        .select()
        .from('tags')
        .where({id: tagId})
        .update({name: req.body[0].name}, ['id', 'name'])
        .then((results) => {
            res.location(`${req.originalUrl}/${results.id}`).status(201).json(results);
        })
        .catch(err => next(err));
})

//Delete
router.delete('/tags/:id', (req, res, next) => {
    const tagId = req.params.id;

    knex
        .select()
        .from('tags')
        .where({id: tagId})
        .del()
        .then((results) => res.json(results))
        .catch(err => next(err));
});

module.exports = router;