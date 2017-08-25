'use strict';
const fse = require('fs-extra');
const async = require('async');
const _ = require('lodash');
const path = require('path');

const xmlutils = require('./xmlutils.js');

const sharedFlowBase = '/sharedflows';
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
 * This module is specifically designed to support the auto-creation of proxy code that implements Apigee best
 * practices in the following areas:
 *
 * -- Error handling
 * -- Generic flow after all other flows to catch requests that fall through
 * -- Authentication and authorization
 * -- Traffic management (particularly setting of SpikeArrest value)
 * -- Threat detection and mitigation
 * -- External configurability of proxy behavior (via properties in API Product, Developer and App definitions, or
 *    via encrypted KVM)
 * -- JWT handling
 * -- Default flow handling (when no conditional flows match)
 * -- Shared Flows usage
 * -- Target Server usage
 *
 * Things I'd like to at least consider covering, but may not be implementable here:
 *
 * -- BaaS access
 * -- Custom analytics
 * -- Caching
 * -- Mock target generation
 *
 * Also:
 *
 * -- Generating SmartDocs from OpenAPI specs (suggested by Nandan Sridhar)
 * -- Test case generation
 */

var updateProxyDescriptor = function (templateSourceFile, destPath, swaggerInfo, cb) {
  var xml = fse.readFileSync(templateSourceFile).toString();

  xmlutils.parseXML(xml, function (err, result) {
    if (err) {
      cb(err, null);
    }

    var rootElement = result[Object.keys(result)[0]];

    // Update the base path (why is it plural "basepaths" in the proxy?)
    xmlutils.createOrUpdateElement(rootElement, 'Basepaths', swaggerInfo.basePath, true, false);
    // Update the description
    xmlutils.createOrUpdateElement(rootElement, 'Description', swaggerInfo.desc, true, false);
    // Update createdat and lastmodifiedat (Linux time stamp)
    var now = Date.now().valueOf();
    xmlutils.createOrUpdateElement(rootElement, 'CreatedAt', now, true, false);
    xmlutils.createOrUpdateElement(rootElement, 'LastModifiedAt', now, true, false);
    // Updated createdby and lastmodifiedby
    xmlutils.createOrUpdateElement(rootElement, 'CreatedBy', now, true, false);
    xmlutils.createOrUpdateElement(rootElement, 'LastModifiedBy', now, true, false);
    // Update display name
    var displayName = (swaggerInfo.title) ? swaggerInfo.title.replace(new RegExp(' '), '_') : swaggerInfo.basePath;
    xmlutils.createOrUpdateElement(rootElement, 'DisplayName', displayName, true, false);

    var xmlDoc = xmlutils.parsedXmlToXmlBuilder(result);
    var xmlString = xmlDoc.end({ pretty: true });
    fse.writeFileSync(destPath, xmlString);

    cb(null, xmlString);
  });
}

var createOrUpdateProxyEndpoints = function (templateSourceFile, destPath, swaggerInfo, cb) {
  var xml = fse.readFileSync(templateSourceFile).toString();

  xmlutils.parseXML(xml, function (err, result) {
    if (err) {
      cb(err, null);
    }

    // Update flows based on what's in the OpenAPI spec
    var flowsElement = xmlutils.getElementByPath(result, '$.ProxyEndpoint.Flows');
    var templateFlow = xmlutils.getElementByPath(flowsElement, 'Flow');
    templateFlow = templateFlow[0];
    xmlutils.removeChild(flowsElement, 'Flow');

    var newFlows = [];
    swaggerInfo.pathObjects.forEach(pathObject => {
      pathObject.operations.forEach(pathOperation => {
        var newFlow = _.cloneDeep(templateFlow);
        xmlutils.createOrUpdateElementAttribute(newFlow, 'name', ((newFlows.length) + '_' + pathOperation.verb), true);
        xmlutils.createOrUpdateElement(newFlow, 'Description', pathOperation.description, true);
        var condition = `((request.verb = \'${pathOperation.verb}\') and (proxy.pathsuffix MatchesPath \'${pathObject.subpath}\'))`
        xmlutils.createOrUpdateElement(newFlow, 'Condition', condition, true);
        newFlows.push(newFlow);
      });
    });

    xmlutils.createOrUpdateElement(flowsElement, 'Flow', newFlows, true);

    // Update the base path
    var httpTargetConnElem = xmlutils.getElementByPath(result, '$.ProxyEndpoint.HTTPProxyConnection');
    xmlutils.createOrUpdateElement(httpTargetConnElem, 'BasePath', swaggerInfo.basePath, true);

    var xmlDoc = xmlutils.parsedXmlToXmlBuilder(result);
    var xmlString = xmlDoc.end({ pretty: true });
    fse.writeFileSync(destPath, xmlString);

    cb(null, xmlString);
  });
}

var createOrUpdateTargetEndpoints = function (templateSourceFile, destPath, swaggerInfo, cb) {
  var xml = fse.readFileSync(templateSourceFile).toString();

  xmlutils.parseXML(xml, function (err, result) {
    if (err) {
      cb(err, null);
    }

    var xmlDoc = xmlutils.parsedXmlToXmlBuilder(result);
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
        // Before creating proxy and target endpoints, copy all of the existing policies and resources
        // from source to target.  We'll keep references to these in the proxy and target endpoints
        // we create.
        // TODO Consider if we need to add logic to only copy *referenced* policies and resources instead of everything in the template.
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
        // If a "sharedflows" directory exists in the template directory, then copy those shared flows too
        // TODO Consider if we need to add logic to only copy *referenced* shared flows and resources instead of everything in the template.
        copyFromFileSystem(
          path.join(sourcePath, sharedFlowBase, '/'),
          path.join(destPath + sharedFlowBase)
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
