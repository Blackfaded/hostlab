const express = require('express');
const router = express.Router();

/* GET help page. */
router.get('/', function(req, res, next) {
    res.render('databases/index');
});

module.exports = router;