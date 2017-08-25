'use strict';
const builder = require('xmlbuilder');
const xmlparser = require('xml2js').parseString;
const _ = require('lodash');

/**
 * Since xml2js doesn't write :( the following 'parsedXmlTo...' functions were created to translate
 * between XML docs read by xml2js and the output doc format created by xmlbuilder.  These are most
 * definitely are not a comprehensive translator - much more testing is needed.
 *
 * TODO Can I do something like this with xml2js to build XML?  Not sure this works with xml2js's funky doc structure.
 *
 * var fs = require('fs'),
 * xml2js = require('xml2js');
 *
 * var obj = {name: "Super", Surname: "Man", age: 23};
 *
 * var builder = new xml2js.Builder();
 * var xml = builder.buildObject(obj);
 */

module.exports = {
  parseXML: function(sourceBuffer, callback) {
    xmlparser(sourceBuffer, callback);
  },

  parsedXmlToXmlBuilderRecursive: function (currentNodeKey, currentNodeValue, parentElement) {
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
          if ((typeof val === 'string') || (typeof val === 'number')) {
            child.txt(val.toString());
          } else if (typeof val === 'object') {
            Object.keys(val).forEach(valKey => {
              this.parsedXmlToXmlBuilderRecursive(valKey, val[valKey], child);
            });
          } else {
            var foo = typeof val;
            throw new Error(`Unknown array node type ${foo}`);
          }
        });
      } else if (currentNodeValue instanceof Map) {
        child = parentElement.ele(currentNodeKey);
        Object.keys(currentNodeValue).forEach((childKey) => {
          this.parsedXmlToXmlBuilderRecursive(childKey, currentNodeValue[childKey], child);
        });
      } else {
        throw new Error('Unknown XML object type');
      }
    }
  },

  parsedXmlToXmlBuilder: function (xmlIn) {
    var roots = Object.keys(xmlIn);
    if (roots.length > 1) {
      throw new Error('Illegal XML document');
    }
    var rootName = roots[0];
    var current = xmlIn[rootName];

    var xmlOut = builder.create(rootName);
    Object.keys(current).forEach((key) => {
      this.parsedXmlToXmlBuilderRecursive(key, current[key], xmlOut);
    });

    return xmlOut;
  },

  getElementByPath: function (root, path) {
    // Uses something like JSONPath (e.g. "$.rootElem.foo.bar" will find the "foo" element child of the root, then find the
    // "bar" element child of "foo".  Not very sophisticated; returns only the first match, and no support for filtering
    // returned children by their content.
    var splitPath = path.split('.');

    var startIndex = 0;
    var currentNode;
    if (splitPath[0] === '$') {
      var rootName = Object.keys(root)[0];
      if (splitPath[1] !== rootName) {
        return undefined;
      }
      currentNode = root[rootName];
      startIndex += 2;
    } else {
      currentNode = root;
    }

    var found = false;
    do {
      var splitName = splitPath[startIndex];
      if (Array.isArray(currentNode)) {
        for (var n in currentNode) {
          if (currentNode[n][splitName]) {
            currentNode = currentNode[n][splitName];
            found = true;
            break;
          }
        }
      } else if (typeof currentNode === 'object') {
        if (!currentNode[splitName]) {
          return undefined;
        }
        currentNode = currentNode[splitPath[startIndex]];
      } else {
        return undefined;
      }
      startIndex++;
    } while (!found && startIndex < splitPath.length);

    return currentNode;
  },

  createOrUpdateElement: function(parent, elemName, elemContent, create, append) {
    var newContent = (Array.isArray(elemContent)) ? elemContent : [ elemContent ];

    if (Array.isArray(parent)) {
      parent.forEach(o => {
        if (o[elemName]) {
          delete o[elemName];
        }
      });
      // TODO surely lodash or another library has a method for copying elements from one array into another.
      if (parent.length == 0) {
        var newParentEntry = {};
        newParentEntry[elemName] = newContent;
        parent.push(newParentEntry);
      } else {
        // TODO only update the first?  Okay in many cases, but perhaps not all.
        parent[0][elemName] = newContent;
      }
    } else if (typeof parent === 'object') {
      if (parent[elemName]) {
        var thisNode = parent[elemName];
        if (append && Array.isArray(thisNode)) {
          thisNode.push(newContent);
        } else {
          parent[elemName] = newContent;
        }
      } else if (create) {
        parent[elemName] = newContent;
      }
    }
  },

  removeChild: function(parent, childName, child) {
    var foundChild;
    if (Array.isArray(parent)) {
      for (var n in parent) {
        if (parent[n][childName]) {
          parent.splice(n, 1)
          break;
        }
      }
    } else if (typeof parent === 'object') {
      foundChild = parent[childName];
      if (foundChild) {
        if (Array.isArray(foundChild)) {
          if (child) {
            // if a child was specified only remove that one child.
            var foundIndex = foundChild.findIndex(child);
            if (foundIndex != -1) {
              foundChild.splice(foundIndex, 1);
            }
          } else {
            // no child? remove all.
            foundChild.splice(0, foundChild.length);
          }
        } else if ((child) && (foundChild == child)) {
          delete parent[childName];
        }
      }
    }
  },

  getElementAttribute: function(elem, attrName) {
    var attrs = elem['$'];
    return (attrs) ? attrs[attrName] : undefined;
  },

  createOrUpdateElementAttribute: function(elem, attrName, attrValue, create) {
    var attrs = elem['$'];
    if ((attrs) && (attrs[attrName] || create)) {
      attrs[attrName] = attrValue;
    }
  }


}
