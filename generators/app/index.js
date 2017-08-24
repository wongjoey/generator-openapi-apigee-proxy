'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const async = require('async');

const validators = require('../../utils/validators.js');
const proxyutils = require('../../utils/proxyutils.js');
const swaggerutils = require('../../utils/swaggerutils.js');

function doDeployProcessing(answerHash) {
  return answerHash.deploy;
}

// Note that option names must be the same as prompt names!
const options = [
  {
    type: (val) => {
      if (validators._specPathValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid spec path value');
      }
    },
    name: 'specPath',
    desc: 'Complete path to the OpenAPI spec file'
  },
  {
    type: (val) => {
      if (validators._destPathValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid source path value');
      }
    },
    name: 'sourcePath',
    desc: 'Complete path of the directory containing your proxy template'
  },
  {
    type: (val) => {
      if (validators._destPathValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid destination path value');
      }
    },
    name: 'destPath',
    desc: 'Complete path of the directory to contain the generated proxy'
  },
  {
    type: (val) => {
      return val;
    },
    name: 'deploy',
    desc: 'If true, the generator will automatically deploy your proxy'
  },
  {
    type: (val) => {
      if (validators._edgeUriValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid Edge URI value');
      }
    },
    name: 'baseuri',
    desc: 'Base URI of your Apigee Edge instance'
  },
  {
    type: (val) => {
      if (validators._orgNameValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid Edge org name value');
      }
    },
    name: 'org',
    desc: 'Name of your Apigee Edge organization'
  },
  {
    type: (val) => {
      if (validators._envNameValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid Edge environment name value');
      }
    },
    name: 'env',
    desc: 'Name of your Apigee Edge environment'
  },
  {
    type: (val) => {
      if (validators._vhValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid Edge virtual host name value');
      }
    },
    name: 'vh',
    desc: 'Name of your Apigee Edge virtual host'
  },
  {
    type: (val) => {
      if (validators._useridValidator(val)) {
        return val;
      } else {
        throw new Error('Invalid Edge user name value');
      }
    },
    name: 'username',
    desc: 'Apigee Edge userid'
  },
  {
    type: (val) => {
      return val;
    },
    name: 'password',
    desc: 'Apigee Edge password'
  }
];

module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);
  }

  initializing() {
    // Load the command line options
    options.forEach((opt) => {
      this.option(opt.name, opt);
    });
  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the unreal ' + chalk.red('generator-openapi-apigee-proxy') + ' generator!'
    ));

    var self = this;

    // Note that prompt names must be the same as option names!
    const prompts = [
      {
        type: 'input',
        name: 'specPath',
        message: 'Enter the complete path to the OpenAPI spec file',
        validate: validators._specPathValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.specPath === 'undefined') &&
              (typeof self.options.config === 'undefined'));
          });
        },
        store: false
      },
      {
        type: 'input',
        name: 'sourcePath',
        message: 'Enter the complete path of the directory containing your proxy template',
        default: this.templatePath('proxy/default'),
        validate: validators._destPathValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.sourcePath === 'undefined') &&
              (typeof self.options.config === 'undefined'));
          });
        },
        store: false
      },
      {
        type: 'input',
        name: 'destPath',
        message: 'Enter the complete path of the directory to contain the generated proxy',
        default: this.destinationPath(),
        validate: validators._destPathValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.destPath === 'undefined') &&
              (typeof self.options.config === 'undefined'));
          });
        },
        store: false
      },
      {
        type: 'confirm',
        name: 'deploy',
        message: 'Should the generator automatically deploy your proxy?',
        default: false,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.deploy === 'undefined') &&
              (typeof self.options.config === 'undefined'));
          });
        },
        store: true
      },
      {
        type: 'input',
        name: 'baseuri',
        message: 'Enter the base URI of your Apigee Edge instance',
        default: 'api.enterprise.apigee.com',
        validate: validators._edgeUriValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.config === 'undefined') &&
              (typeof self.options.baseuri === 'undefined') &&
              doDeployProcessing(answerHash));
          });
        },
        store: true
      },
      {
        type: 'input',
        name: 'org',
        message: 'Enter the name of your Apigee Edge organization',
        validate: validators._orgNameValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.config === 'undefined') &&
              (typeof self.options.org === 'undefined') &&
              doDeployProcessing(answerHash));
          });
        },
        store: true
      },
      {
        type: 'input',
        name: 'env',
        message: 'Enter the name of your Apigee Edge environment',
        validate: validators._envNameValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.config === 'undefined') &&
              (typeof self.options.env === 'undefined') &&
              doDeployProcessing(answerHash));
          });
        },
        store: true
      },
      {
        type: 'input',
        name: 'vh',
        message: 'Enter the name of your Apigee Edge virtual host',
        validate: validators._vhValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.config === 'undefined') &&
              (typeof self.options.vh === 'undefined') &&
              doDeployProcessing(answerHash));
          });
        },
        store: true
      },
      {
        type: 'input',
        name: 'username',
        message: 'Enter your Apigee Edge userid',
        validate: validators._useridValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.config === 'undefined') &&
              (typeof self.options.username === 'undefined') &&
              doDeployProcessing(answerHash));
          });
        },
        store: true
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your Apigee Edge password',
        validate: validators._passwordValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve((typeof self.options.config === 'undefined') &&
              (typeof self.options.password === 'undefined') &&
              doDeployProcessing(answerHash));
          });
        },
        store: false
      }
    ];

    return this.prompt(prompts).then(props => {
      self.props = _.merge({}, self.options, props);

      // munge
      if (self.props.specPath.startsWith('\'') && self.props.specPath.endsWith('\'')) {
        self.props.specPath = self.props.specPath.substring(1, self.props.specPath.length - 1);
      }
      if (self.props.sourcePath.startsWith('\'') && self.props.sourcePath.endsWith('\'')) {
        self.props.sourcePath = self.props.sourcePath.substring(1, self.props.sourcePath.length - 1);
      }
      if (self.props.destPath.startsWith('\'') && self.props.destPath.endsWith('\'')) {
        self.props.destPath = self.props.destPath.substring(1, self.props.destPath.length - 1);
      }
    });
  }

  configuring() {

  }

  default() {

  }

  writing() {
    this.log(`Building completed template from swagger ${this.props.specPath} and proxy ${this.props.sourcePath}`);

    var self = this;

    // convert the spec into a swaggerInfo object
    return swaggerutils.parse(self.props.specPath)
      .then((swaggerInfo) => {
        // generate the proxy
        proxyutils.generateProxy(self.props.sourcePath, self.props.destPath, swaggerInfo, self.props, function(err, results) {
          if (err) {
            throw err;
          }
        });
      });
  }

  /**
  conflicts() {

  }
   **/

  install() {
    // this.npmInstall();
    var self = this;

    return new Promise(function(resolve, reject) {
      if (doDeployProcessing(self.props)) {
        self.log('Doing deploy processing!');
      } else {
        self.log('Not doing deploy processing!');
      }

      resolve();
    });
  }

  end() {

  }

};
