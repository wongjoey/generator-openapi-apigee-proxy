'use strict';
const builder = require('xmlbuilder');
const xmlparser = require('xml2js').parseString;
const fse = require('fs-extra');
const async = require('async');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const basePath = '/apiproxy';
const proxyBase = path.join(basePath, '/proxies');
const targetBase = path.join(basePath, '/targets');
const resourceBase = path.join(basePath, '/resources');
const jsResourceBase = path.join(resourceBase, "/js");
const nodeResourceBase = path.join(resourceBase, "/node");
const xslResourceBase = path.join(resourceBase, "/xsl");
const pyResourceBase = path.join(resourceBase, "/py");
const javaResourceBase = path.join(resourceBase, "/java");
const policyBase = path.join(basePath, '/policies');

/**
 * Since xml2js doesn't write :( the following 'parsedXmlTo...' functions were created to translate
 * between XML docs read by xml2js and the output doc format created by xmlbuilder.  These are most
 * definitely are not a comprehensive translator - much more testing is needed.
 */
// var parsedXmlToXmlBuilderRecursive = function (currentNodeKey, currentNodeValue, parentElement) {
//   if (currentNodeKey === '$') {
//     // attribute of current parent
//     Object.keys(currentNodeValue).forEach((name) => {
//       parentElement.att(name, currentNodeValue[name]);
//     });
//   } else {
//     // child of current parent
//     var child = parentElement.ele(currentNodeKey);
//     // TODO this won't handle mixed text/element content
//     if (Array.isArray(currentNodeValue)) {
//       currentNodeValue.forEach((val) => {
//         if (typeof val === 'string') {
//           child.txt(val);
//         } else if (typeof val === 'object') {
//           Object.keys(val).forEach(valKey => {
//             parsedXmlToXmlBuilderRecursive(valKey, val[valKey], child);
//           });
//         } else {
//           var foo = typeof val;
//           throw new Error(`Unknown array node type ${foo}`);
//         }
//       });
//     } else if (currentNodeValue instanceof Map) {
//       Object.keys(currentNodeValue).forEach((childKey) => {
//         parsedXmlToXmlBuilderRecursive(childKey, currentNodeValue[childKey], child);
//       });
//     } else {
//       throw new Error('Unknown XML object type');
//     }
//   }
// }

var parsedXmlToXmlBuilderRecursive = function (currentNodeKey, currentNodeValue, parentElement) {
  if (currentNodeKey === '$') {
    // attribute(s) of current parent
    Object.keys(currentNodeValue).forEach((name) => {
      parentElement.att(name, currentNodeValue[name]);
    });
  } else {
    // child(ren) of current parent
    // TODO this won't handle mixed text/element content
    var child = null;
    if (Array.isArray(currentNodeValue)) {
      currentNodeValue.forEach((val) => {
        child = parentElement.ele(currentNodeKey);
        if (typeof val === 'string') {
          child.txt(val);
        } else if (typeof val === 'object') {
          Object.keys(val).forEach(valKey => {
            parsedXmlToXmlBuilderRecursive(valKey, val[valKey], child);
          });
        } else {
          var foo = typeof val;
          throw new Error(`Unknown array node type ${foo}`);
        }
      });
    } else if (currentNodeValue instanceof Map) {
      child = parentElement.ele(currentNodeKey);
      Object.keys(currentNodeValue).forEach((childKey) => {
        parsedXmlToXmlBuilderRecursive(childKey, currentNodeValue[childKey], child);
      });
    } else {
      throw new Error('Unknown XML object type');
    }
  }
}

var parsedXmlToXmlBuilder = function (xmlIn) {
  var roots = Object.keys(xmlIn);
  if (roots.length > 1) {
    throw new Error('Illegal XML document');
  }
  var rootName = roots[0];
  var current = xmlIn[rootName];

  var xmlOut = builder.create(rootName);
  // var currentOut = xmlOut;
  Object.keys(current).forEach((key) => {
    // var val = current[key];
    parsedXmlToXmlBuilderRecursive(key, current[key], xmlOut);
  });

  return xmlOut;
}

var updateProxyDescriptor = function (templateSourceFile, destPath, swaggerInfo, cb) {
  var xml = fse.readFileSync(templateSourceFile).toString();

  xmlparser(xml, function (err, result) {
    if (err) {
      cb(err, null);
    }

    var xmlDoc = parsedXmlToXmlBuilder(result);
    var xmlString = xmlDoc.end({ pretty: true });
    fse.writeFileSync(destPath, xmlString);

    cb(null, xmlString);
  });
}

var createOrUpdateProxyEndpoints = function (templateSourceFile, destPath, swaggerInfo, cb) {
  var xml = fse.readFileSync(templateSourceFile).toString();

  xmlparser(xml, function (err, result) {
    if (err) {
      cb(err, null);
    }

    var xmlDoc = parsedXmlToXmlBuilder(result);
    var xmlString = xmlDoc.end({ pretty: true });
    fse.writeFileSync(destPath, xmlString);

    cb(null, xmlString);
  });
}

var createOrUpdateTargetEndpoints = function (templateSourceFile, destPath, swaggerInfo, cb) {
  var xml = fse.readFileSync(templateSourceFile).toString();

  xmlparser(xml, function (err, result) {
    if (err) {
      cb(err, null);
    }

    var xmlDoc = parsedXmlToXmlBuilder(result);
    var xmlString = xmlDoc.end({ pretty: true });
    fse.writeFileSync(destPath, xmlString);

    cb(null, xmlString);
  });
}

var copyFromFileSystem = function (sourcePath, destPath) {
  try {
    fse.copySync(sourcePath, destPath);
  } catch (err) {
    throw err;
  }
}

module.exports = {
  generateProxy: function(sourcePath, destPath, swaggerInfo, props, returnCallback) {

    async.series([
      function(cb) {
        try {
          // Delete and recreate the contents of the destination directory.
          fse.emptyDirSync(path.join(destPath + basePath));
          cb(null);
        } catch (err) {
          cb(err);
        }
      },
      function (cb) {
        // Before creating proxy and target endpoints, copy all of the policies and resources
        // from source to target.  We'll keep references to these in the proxy and target endpoints
        // we create.
        copyFromFileSystem(
          path.join(sourcePath, policyBase, '/'),
          path.join(destPath + policyBase)
        );
        copyFromFileSystem(
          path.join(sourcePath, resourceBase, '/'),
          path.join(destPath, resourceBase)
        );

        cb(null);
      },
      function (cb) {
        // verify destination path exists
        var createdPath = path.join(destPath, basePath);
        if (!fse.pathExistsSync(createdPath)) {
          fse.mkdirsSync(createdPath);
        }

        // create the proxy descriptor from the template
        updateProxyDescriptor(
          path.join(sourcePath, basePath, 'PublicAPI.xml'),
          path.join(createdPath, 'PublicAPI.xml'),
          swaggerInfo,
          cb
        );
      },
      function (cb) {
        // verify destination path exists
        var createdPath = path.join(destPath, proxyBase);
        if (!fse.pathExistsSync(createdPath)) {
          fse.mkdirsSync(createdPath);
        }

        // create the proxy endpoint(s) from the template
        createOrUpdateProxyEndpoints(
          path.join(sourcePath, proxyBase, 'default.xml'),
          path.join(createdPath, 'default.xml'),
          swaggerInfo,
          cb
        );
      },
      function (cb) {
        // verify destination path exists
        var createdPath = path.join(destPath, targetBase);
        if (!fse.pathExistsSync(createdPath)) {
          fse.mkdirsSync(createdPath);
        }

        // create the target(s) from the template
        createOrUpdateTargetEndpoints(
          path.join(sourcePath, targetBase, 'default.xml'),
          path.join(destPath, targetBase, 'default.xml'),
          swaggerInfo,
          cb
        );
      }
    ],
    function(err, results) {
      returnCallback(err, path.join(destPath, basePath));
    });
  }

}
