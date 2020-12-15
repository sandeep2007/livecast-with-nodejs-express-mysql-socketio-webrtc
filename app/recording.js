const express = require('express')
const router = express.Router()

const dateFormat = require('dateformat');
const fn = require('../lib/functions')

const userHandler = require('../lib/userHandler');

const multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
let formData = multer({ storage: storage });

router.post('/upload', formData.single('myFile'), (req, res, next) => {

    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    userHandler.saveStreamFile(file.filename, req.body.uniqCastId);
    res.send(file);
})

module.exports = router