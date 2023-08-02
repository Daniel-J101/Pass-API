const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, passService } = require('../services');

const generatePass = catchAsync(async (req, res) => {
  const result = await passService.generatePass(req.body);
  if (result == 'success') {
    res.status(httpStatus.CREATED).send({ message: 'Pass created' });
  } else {
    console.log('error result was ', result);
    res.status(httpStatus.BAD_REQUEST).send({ message: result });
  }
  console.log('Finished generating pass');
});

const downloadPass = catchAsync(async (req, res) => {
  res.status(httpStatus.CREATED).send({ message: 'User created' });
  console.log('this worked');
});

module.exports = {
  generatePass,
  downloadPass,
};
