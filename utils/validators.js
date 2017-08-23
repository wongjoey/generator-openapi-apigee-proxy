'use strict';

var validateWithPromise = function (val, validatorFunction)
{
  return new Promise(function (resolve, reject) {
    var result = validatorFunction(val);
    if (result === true) {
      resolve(result);
    } else if (result instanceof Error) {
      reject(result);
    } else {
      reject(new Error(result));
    }
  });
}


module.exports = {

  _specPathValidator: function (specPath) {
    return validateWithPromise(specPath, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  },

  _destPathValidator: function (destPath) {
    return validateWithPromise(destPath, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  },

  _edgeUriValidator: function (edgeUri) {
    return validateWithPromise(edgeUri, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  },

  _orgNameValidator: function (orgName) {
    return validateWithPromise(orgName, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  },

  _envNameValidator: function (envName) {
    return validateWithPromise(envName, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  },

  _vhValidator: function (vhName) {
    return validateWithPromise(vhName, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  },

  _useridValidator: function (userid) {
    return validateWithPromise(userid, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  },

  _passwordValidator: function (password) {
    return validateWithPromise(password, function (val) {
      // CHANGE THIS TO DO VALIDATION
      return typeof val === 'string';
    });
  }

}
