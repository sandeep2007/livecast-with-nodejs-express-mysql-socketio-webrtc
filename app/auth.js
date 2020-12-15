const express = require('express')
const router = express.Router()

const dateFormat = require('dateformat');
const fn = require('../lib/functions')
const Database = require('../lib/Database')

const conn = new Database()

const multer = require('multer');
let formData = multer();

const userTableName = process.env.USER_TABLE_NAME;

router.post('/login', formData.array(), async (req, res) => {

    try {
        let date = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
        let email = (!fn.isEmpty(req.body.email)) ? req.body.email : null;
        let password = (!fn.isEmpty(req.body.password)) ? req.body.password : null;
        let rows = await conn.query("SELECT t1.auth_key as token,t1.id,t1.email from ?? as t1 where t1.email=? and t1.password=? LIMIT 1", [userTableName, email, password])
        if (!fn.isEmpty(rows[0])) {

            res.status(200).json({ data: rows[0], message: 'Success' })
        }
        else {
            res.status(404).json({ data: [], message: 'Not found' })
        }
    }
    catch (err) {
        res.status(403).json({ message: err });
    }
    res.send()
})

module.exports = router