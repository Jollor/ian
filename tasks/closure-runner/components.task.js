var async = require('async');
var fs = require('fs');


module.exports = function (runner, args, callback) {
  var project_dirname = runner.getProjectDirname();
  var output_filename = runner.getAppConfigValue('output.components');
  var app_namespaces = runner.getAppConfigValue('namespaces');
  var component_namespaces = runner.getAppConfigValue('namespaces.components');

  if (!component_namespaces || component_namespaces.length === 0) {
    return callback(null);
  }
  if (!output_filename) {
    return callback(new Error(
      'The component export location "output.components" ' +
      'is not specified for this app'
    ));
  }

  async.waterfall([
    runner.runTask.bind(runner, 'deps'),

    function (callback) {
      var deps_filename = runner.getAppConfigValue('output.deps');
      var deps_source = fs.readFileSync(deps_filename, 'utf8');

      deps_source = deps_source.replace(/^\/\/.*$/gm, '');
      deps_source = deps_source.replace(/'/g, '"');
      deps_source = deps_source.replace(/^goog.addDependency\(/gm, '[');
      deps_source = deps_source.replace(/\);$/gm, '],');
      deps_source = '[' + deps_source.replace(/,\s*$/, '') + ']';

      var deps = JSON.parse(deps_source);
      var components = [];

      deps.forEach(function (file) {
        var provides = file[1];
        provides.forEach(function (namespace) {
          component_namespaces.forEach(function (component_namespace) {
            var prefix = namespace.substr(0, component_namespace.length + 1);
            if (prefix === component_namespace + '.') {
              components.push(namespace);
            }
          });
        });
      });

      var component_requires = components.map(function (component) {
        return 'goog.require("' + component + '");'
      });
      var component_exports = components.map(function (component) {
        return 'goog.exportSymbol("' + component + '", ' + component + ');'
      });

      var output =
        '// This file was autogenerated by the "components" task.\n' +
        '// Please do not edit.\n' +
        'goog.provide("ian.ui.$$components");\n' +
        component_requires.join('\n') + '\n' +
        component_exports.join('\n') + '\n';

      fs.writeFileSync(output_filename, output, 'utf8');

      app_namespaces.push('ian.ui.$$components');
      callback(null);
    }
  ], callback);
};
