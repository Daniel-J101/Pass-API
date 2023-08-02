const express = require('express');
const validate = require('../../middlewares/validate');
const passValidation = require('../../validations/pass.validation');
const passController = require('../../controllers/pass.controller');

const router = express.Router();

router.post('/generate', validate(passValidation.generatePass), passController.generatePass);
router.post('/download', [], passController.downloadPass);

module.exports = router;
