'use strict';
const builder = require('xmlbuilder');
const xmlparser = require('xml2js').parseString;
const fse = require('fs-extra');

var basePath = '/apiproxy';
var proxyBase = basePath + '/proxies';
var targetBase = basePath + '/targets';
var resourceBase = basePath + '/resources';
var jsResourceBase = resourceBase + "/js";
var nodeResourceBase = resourceBase + "/node";
var xslResourceBase = resourceBase + "/xsl";
var pyResourceBase = resourceBase + "/py";
var javaResourceBase = resourceBase + "/java";
var policyBase = basePath + '/policies';

var parsedXmlToXmlBuilderRecursive = function (currentNodeKey, currentNodeValue, parentElement) {
  if (currentNodeKey === '$') {
    // attribute of current parent
    Object.keys(currentNodeValue).forEach((name) => {
      parentElement.att(name, currentNodeValue[name]);
    });
  } else {
    // child of current parent
    var child = parentElement.ele(currentNodeKey);
    if (Array.isArray(currentNodeValue)) {
      currentNodeValue.forEach((val) => {
        child.txt(val);
      });
    } else if (currentNodeValue instanceof Map) {
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
  var currentOut = xmlOut;
  Object.keys(current).forEach((key) => {
    var val = current[key];
    parsedXmlToXmlBuilderRecursive(key, val, currentOut);
  });

  return xmlOut;
}

module.exports = {
  getBasePath: function () { return basePath; },
  getProxyBase: function () { return proxyBase; },
  getTargetBase: function () { return targetBase; },
  getResourceBase: function () { return resourceBase; },
  getJSResourceBase: function () { return jsResourceBase; },
  getPythonResourceBase: function () { return pyResourceBase; },
  getJavaResourceBase: function () { return javaResourceBase; },
  getXSLResourceBase: function () { return xslResourceBase; },
  getNodeResourceBase: function () { return nodeResourceBase; },
  getPolicyBase: function () { return policyBase; },

  copyFromFileSystem: function (sourcePath, destPath) {
    try {
      fse.copySync(sourcePath, destPath);
    } catch (err) {
      throw err;
    }
  },

  updateProxyDescriptor: function (templateSourceFile, destPath, swaggerInfo, cb) {
    var xml = fse.readFileSync(templateSourceFile).toString();
    xmlparser(xml, function (err, result) {
      var xmlDoc = parsedXmlToXmlBuilder(result);
      var xmlString = xmlDoc.end({ pretty: true });
      fse.writeFileSync(destPath, xmlString);
      cb(null, xmlString);
    });
  },

  createOrUpdateProxyEndpoints: function (templateSourceFile, destPath, swaggerInfo, cb) {
    var xml = fse.readFileSync(templateSourceFile).toString();
    xmlparser(xml, function (err, result) {
      cb(null, result);
    });
  },

  createOrUpdateTargetEndpoints: function (templateSourceFile, destPath, swaggerInfo, cb) {
    var xml = fse.readFileSync(templateSourceFile).toString();
    xmlparser(xml, function (err, result) {
      cb(null, result);
    });
  }

}
