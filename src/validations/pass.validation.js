const Joi = require('joi');
const { password } = require('./custom.validation');

const generatePass = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    gradeLevel: Joi.number().required(),
    graduationYear: Joi.number().required(),
    advisory: Joi.string().required(),
    studentID: Joi.number().required(),
    schoolYear: Joi.string().required(),
    barcodeData: Joi.string().required(),
    imageURL: Joi.string().required(),
  }),
};

module.exports = {
  generatePass,
};
