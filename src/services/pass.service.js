const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const fs = require('fs');
require('dotenv').config();
const { PKPass } = require('passkit-generator');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { storage, db } = require('../utils/firebase');
const { sendPassEmail } = require('./email.service');

const generatePass = async (body) => {
  try {
    const { schoolYear, barcodeData, name, email, gradeLevel, graduationYear, advisory, studentID, imageURL } = body;

    //file paths
    const model = path.join(__dirname, '../model/strake.pass');
    const wwdr = path.join(__dirname, '../certs/wwdr.pem');
    const signerCert = path.join(__dirname, '../certs/signerCert.pem');
    const signerKey = path.join(__dirname, '../certs/signerKey.pem');

    //pass info
    const authenticationToken = generateAuthenticationToken(16); //generate 32 digit token for pass
    const serialNumber = `SJ-${schoolYear}-${barcodeData}`; // create serial number for pass

    //barcode info
    const passBarcode = {
      format: 'PKBarcodeFormatCode128',
      message: barcodeData,
      messageEncoding: 'utf-8',
      altText: `Card expires July 30, ${schoolYear.split('-')[1]}`, //2023-2024 -> 2024
    };

    //create pass
    const pass = await PKPass.from(
      {
        model: model,
        certificates: {
          wwdr: fs.readFileSync(wwdr, 'utf8'),
          signerCert: fs.readFileSync(signerCert, 'utf8'),
          signerKey: fs.readFileSync(signerKey, 'utf8'),
          signerKeyPassphrase: process.env.PASSWORD,
        },
      },
      {
        authenticationToken: authenticationToken,
        serialNumber: serialNumber,
      }
    );
    //set pass information
    pass.setBarcodes(passBarcode);
    pass.primaryFields.push({
      key: 'name',
      label: 'Student Identification',
      value: name,
    });
    pass.secondaryFields.push(
      {
        key: 'grade',
        label: 'Grade',
        value: gradeLevel,
        textAlignment: 'PKTextAlignmentNatural',
      },
      {
        key: 'class',
        label: 'Class',
        value: graduationYear,
        textAlignment: 'PKTextAlignmentRight',
      }
    );
    pass.auxiliaryFields.push(
      {
        key: 'advisory',
        label: 'Advisory',
        value: advisory,
      },
      {
        key: 'studentID',
        label: 'Student ID #',
        value: studentID,
        textAlignment: 'PKTextAlignmentCenter',
      },
      {
        key: 'schoolYear',
        label: 'School Year',
        value: schoolYear,
        textAlignment: 'PKTextAlignmentRight',
      }
    );
    pass.backFields.push({
      key: 'expiration',
      label: `Expires July 30, ${schoolYear.split('-')[1]}`,
      value: '',
      textAlignment: 'PKTextAlignmentCenter',
    });

    //add image to pass
    const resp = await axios.get(imageURL, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(resp.data, 'utf-8');
    pass.addBuffer('thumbnail.png', imageBuffer);
    pass.addBuffer('thumbnail@2x.png', imageBuffer);

    //convert to sendable data
    const bufferData = pass.getAsBuffer();
    // fs.writeFileSync(`${serialNumber}.pkpass`, bufferData);

    //send recipient email
    sendPassEmail(email, bufferData);

    // upload to firebase
    storage.file(`${schoolYear}/${serialNumber}.pkpass`).save(bufferData, (error) => {
      if (!error) {
        console.log('file upload successful');
      } else {
        console.log('error at file upload', error);
        return error.message;
      }
    });

    //log creation info
    db.collection('users')
      .doc(email)
      .set({
        name: name,
        email: email,
        passFileLocation: `${schoolYear}/${serialNumber}.pkpass`,
      });
    return 'success';
  } catch (error) {
    console.log('error', error);
    return error.message;
  }
};

const downloadPass = async (body) => {};

function generateAuthenticationToken(length) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  generatePass,
  downloadPass,
};
