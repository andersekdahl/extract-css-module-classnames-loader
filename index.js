var assign = require('lodash.assign');
var processCss = requireFromLocalOrParent('css-loader/lib/processCss');
var loaderUtils = require('loader-utils');
var mkpath = require('mkpath');
var path = require('path');
var fs = require('fs');

var files = {};
var timer;

module.exports = function (source, map) {
  if (this.cacheable) this.cacheable();
  var resourcePath = this.resourcePath;
  var query = loaderUtils.parseQuery(this.query);
  var outputFile = query.outputFile;
  var rootPath = query.rootPath || '/';
  var minimalJson = !!query.minimalJson;
  var writeDebounceMs = query.writeDebounceMs || 100;
  var options = this.options.extractCssModuleClassnames || {};
  var processOpts = {
    mode: 'local',
    loaderContext: {
      options: {
        context: this.options.context
      },
      // Note! This assumes that `extract-css-module-classnames-loader` is directly in front of
      // the `css-loader`
      loaderIndex: this.loaderIndex - 1,
      resource: this.resource,
      loaders: this.loaders,
      request: this.request,
      resourcePath: resourcePath
    },
    query: query
  }
  var aliases = getAliases(this.options);
  var importPath = path.relative(rootPath, resourcePath);

  files[importPath] = files[importPath] || {};

  processCss(source, null, processOpts, function(err, result) {
    if (err) throw err;

    Object.keys(result.exports).forEach(function(key) {

      var classes = result.exports[key].split(/\s+/);

      files[importPath][key] = classes.map(function (className) {

        if (isClassName(result, className)) {
          return className;
        }

        var importItem = getImportItem(result, className);
        var resolvedPath = resolvePath(importItem.url);
        var composesPath = resolvedPath || path.resolve(path.dirname(resourcePath), importItem.url);

        return [ path.relative(rootPath, composesPath), importItem.export ];

      });

    });

    if (options.onOutput && typeof options.onOutput === 'function') {
      options.onOutput(resourcePath, files[importPath], files);
    } else {
      if (!outputFile) {
        throw new Error('Missing outputFile parameter in extract-css-module-classnames-loader');
      }
      clearTimeout(timer);
      timer = setTimeout(function () {
        mkpath(path.dirname(outputFile), function (err) {
          if (err && err.code !== 'EEXIST') throw err;
          var json;
          if (minimalJson) {
            json = JSON.stringify(files);
          } else {
            json = JSON.stringify(files, null, 2);
          }
          fs.writeFile(outputFile, json, function (err) {
            if (err) throw err;
            options.onAfterOutput && options.onAfterOutput(resourcePath, files[importPath], files);
          });
        });
      }, writeDebounceMs);
    }
  });

  function getAliases (options) {
    // TODO: Investigate if there is a way to leverage
    // the Webpack API to get all the aliases
    var resolveAliases = options.resolve && options.resolve.alias;
    var resolveLoaderAliases = options.resolveLoader && options.resolveLoader.alias;
    return assign({}, resolveAliases || {}, resolveLoaderAliases || {});
  }

  function isClassName (result, className) {
    result.importItemRegExpG.lastIndex = 0;
    return !result.importItemRegExpG.test(className);
  }

  /**
   * Return the unaliased path of an aliased import (if any)
   *
   * @param  {String} importPath Import path (e.g. import 'path/to/foo.css')
   * @return {String}            The relative path of an aliased import (if any),
   *                             otherwise empty string
   */
  function resolvePath (importPath) {
    // TODO: Investigate if there is a way to leverage
    // the Webpack API to handle the alias resolution instead
    return Object.keys(aliases).reduce(function (prev, alias) {
      var regex = new RegExp('^' + alias, 'i');
      if (!regex.test(importPath)) { return prev }
      var unaliasedPath = importPath.replace(regex, aliases[alias]);
      return path.resolve(rootPath, unaliasedPath);
    }, '');
  }

  function getImportItem (result, className) {
    var match = result.importItemRegExp.exec(className);
    var idx = +match[1];
    return result.importItems[idx];
  }

  return source;
};

// Needed to make require work with `npm link` since `css-loader`
// is a peerDependency
function requireFromLocalOrParent(id) {
  var parent = module;
  for (; parent; parent = parent.parent) {
    try {
      return parent.require(id);
    } catch(ex) {}
  }
  throw new Error("Cannot find module '" + id + "'");
};