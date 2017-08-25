'use strict';
var parser = require('swagger-parser');

const VENDOR_EXTENSION_PREFIX = 'x-';

module.exports = {
  parse: function (specPath) {
    return parser.validate(specPath).then((api) => {
      var pathObjects = [];
      var vendorExtensions = {};

      Object.keys(api.paths).forEach(function (pathKey) {
        var pathValue = api.paths[pathKey];

        var path = {};
        path.subpath = pathKey;
        path.operations = [];
        path.vendorExtensions = {};

        // Iterate through keys in paths object
        Object.keys(pathValue).forEach(function (verbKey) {
          var verbValue = pathValue[verbKey];
          if (verbKey.toLowerCase().startsWith(VENDOR_EXTENSION_PREFIX)) {
            // Paths-level vendor extension
            vendorExtensions[verbKey] = verbValue;
          } else {
            // Path operation
            Object.keys(verbValue).forEach(function (xKey) {
              var xValue = verbValue[xKey];
              if (xKey.toLowerCase().startsWith(VENDOR_EXTENSION_PREFIX)) {
                // Path operation level vendor extension
                path.vendorExtensions[xKey] = xValue;
              }
            });

            var operation = {};
            operation.verb = verbKey;
            operation.description = (verbValue.description) ? verbValue.description : '';
            operation.consumes = (verbValue.consumes) ? verbValue.consumes : [];
            operation.produces = (verbValue.produces) ? verbValue.produces : [];
            operation.responseStatusCodes = [];
            Object.keys(verbValue.responses).forEach(function (statusKey) {
              operation.responseStatusCodes.push({ statusCode: statusKey, desc: verbValue.responses[statusKey].description });
            });

            path.operations.push(operation);
          }
        });

        pathObjects.push(path);
      });

      var parseResult = {
        title: api.info.title,
        version: api.info.version,
        desc: api.info.description,
        host: api.host,
        basePath: api.basePath,
        schemes: api.schemes,
        pathObjects: pathObjects,
        vendorExtensions: vendorExtensions
      };

      return parseResult;
    });
  }
};
