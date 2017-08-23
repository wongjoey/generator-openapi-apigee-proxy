'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const fs = require('fs');
const path = require('path');
const async = require('async');

const validators = require('../../utils/validators.js');
const proxyutils = require('../../utils/proxyutils.js');
const swaggerutils = require('../../utils/swaggerutils.js');

function doDeployProcessing(answerHash) {
  return answerHash.deploy;
}



module.exports = class extends Generator {
  constructor(args, options) {
    super(args, options);
  }

  initializing() {

  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the unreal ' + chalk.red('generator-openapi-apigee-proxy') + ' generator!'
    ));

    const prompts = [
      {
        type: 'input',
        name: 'specPath',
        message: 'Enter the complete path to the OpenAPI spec file',
        validate: validators._specPathValidator
      },
      {
        type: 'input',
        name: 'sourcePath',
        message: 'Enter the complete path of the directory containing your proxy template',
        default: this.templatePath('proxy/default'),
        validate: validators._destPathValidator
      },
      {
        type: 'input',
        name: 'destPath',
        message: 'Enter the complete path of the directory to contain the generated proxy',
        default: this.destinationPath(),
        validate: validators._destPathValidator
      },
      {
        type: 'confirm',
        name: 'deploy',
        message: 'Should the generator automatically deploy your proxy?',
        default: false
      },
      {
        type: 'input',
        name: 'baseuri',
        message: 'Enter the base URI of your Apigee Edge instance',
        default: 'api.enterprise.apigee.com',
        validate: validators._edgeUriValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve(doDeployProcessing(answerHash));
          });
        }
      },
      {
        type: 'input',
        name: 'org',
        message: 'Enter the name of your Apigee Edge organization',
        validate: validators._orgNameValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve(doDeployProcessing(answerHash));
          });
        }
      },
      {
        type: 'input',
        name: 'env',
        message: 'Enter the name of your Apigee Edge environment',
        validate: validators._envNameValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve(doDeployProcessing(answerHash));
          });
        }
      },
      {
        type: 'input',
        name: 'vh',
        message: 'Enter the name of your Apigee Edge virtual host',
        validate: validators._vhValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve(doDeployProcessing(answerHash));
          });
        }
      },
      {
        type: 'input',
        name: 'username',
        message: 'Enter your Apigee Edge userid',
        validate: validators._useridValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve(doDeployProcessing(answerHash));
          });
        }
      },
      {
        type: 'password',
        name: 'password',
        message: 'Enter your Apigee Edge password',
        validate: validators._passwordValidator,
        when: function (answerHash) {
          return new Promise(function(resolve, reject) {
            resolve(doDeployProcessing(answerHash));
          });
        }
      }
    ];

    // TODO I still don't quite understand why "this" isn't available in the then() function below...
    var self = this;

    return this.prompt(prompts).then(props => {
      // munge
      if (props.specPath.startsWith('\'') && props.specPath.endsWith('\'')) {
        props.specPath = props.specPath.substring(1, props.specPath.length - 1);
      }
      if (props.sourcePath.startsWith('\'') && props.sourcePath.endsWith('\'')) {
        props.sourcePath = props.sourcePath.substring(1, props.sourcePath.length - 1);
      }
      if (props.destPath.startsWith('\'') && props.destPath.endsWith('\'')) {
        props.destPath = props.destPath.substring(1, props.destPath.length - 1);
      }
      // To access props later use this.props.someAnswer;
      self.props = props;
      // this.props = props;
    });
  }

  configuring() {

  }

  default() {

  }

  writing() {
    // this.fs.copy(
    //   this.templatePath('dummyfile.txt'),
    //   this.destinationPath('dummyfile.txt')
    // );

    this.log(`Building completed template from swagger ${this.props.specPath} and proxy ${this.props.sourcePath}`);

    try {
      var foo = this.fs.read(this.props.specPath);
      this.log(`${foo}`);
    }
    catch(err) {
      throw new Error(`Swagger file ${this.props.specPath} is invalid or does not exist.`);
    }

    swaggerutils.parse(this.props.specPath, (err, swaggerInfo) => {
      this.sourceRoot(this.props.sourcePath);
      this.destinationRoot(this.props.destPath);

      // Discovered that this.templatePath() and this.destinationPath() don't work when
      // their arguments are the results of functions - they only work with literals.
      // Go figure.

      var self = this;

      async.series([
        function (cb) {
          // Before creating proxy and target endpoints, copy all of the policies and resources
          // from source to target.  We'll keep references to these in the proxy and target endpoints
          // we create.
          proxyutils.copyFromFileSystem(
            path.join(self.props.sourcePath, proxyutils.getPolicyBase(), '/'),
            path.join(self.props.destPath + proxyutils.getPolicyBase())
          );
          proxyutils.copyFromFileSystem(
            path.join(self.props.sourcePath, proxyutils.getResourceBase(), '/'),
            path.join(self.props.destPath + proxyutils.getResourceBase())
          );

          cb(null);
        },
        function (cb) {
          // create the proxy descriptor from the template
          proxyutils.updateProxyDescriptor(
            path.join(self.props.sourcePath, proxyutils.getBasePath(), 'PublicAPI.xml'),
            path.join(self.props.destPath + proxyutils.getResourceBase()),
            swaggerInfo,
            cb
          );
        },
        function (cb) {
          // create the proxy endpoint(s) from the template
          proxyutils.createOrUpdateProxyEndpoints(
            path.join(self.props.sourcePath, proxyutils.getProxyBase(), 'default.xml'),
            path.join(self.props.destPath, proxyutils.getProxyBase()),
            swaggerInfo,
            cb
          );
        },
        function (cb) {
          // create the target(s) from the template
          proxyutils.createOrUpdateTargetEndpoints(
            path.join(self.props.sourcePath, proxyutils.getTargetBase(), 'default.xml'),
            path.join(self.props.destPath, proxyutils.getTargetBase()),
            swaggerInfo,
            cb
          );
        }
      ],
      function(err, results) {
        // results is now equal to ['one', 'two']
      });
    });
  }

  conflicts() {

  }

  install() {
    // this.npmInstall();
    if (doDeployProcessing(this.props)) {
      this.log('Doing deploy processing!');
    } else {
      this.log('Not doing deploy processing!');
    }
  }

  end() {

  }

};
