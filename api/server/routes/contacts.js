const express = require("express");
const  requireJwtAuth  = require('~/server/middleware/requireJwtAuth');
const multer = require('multer');
const { allContact, setContact, importFile, updateContact,deleteContact } = require("../controllers/contact.controller");
const router = express.Router();
console.log('contacts router loaded'); 
const upload = multer({ dest: 'uploads/' });


router.get('/get', (req, res) => {
  res.json({ test: 'hello from contacts' });
});

router.get('/',allContact);
router.post('/addContact',setContact);
router.post('/import',upload.single('file'),importFile);
router.put('/:id',updateContact);
router.delete('/:id', deleteContact);

module.exports = router;