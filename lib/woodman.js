/**
 * @fileoverview Main entry-point of the Woodman library that integrates all
 * known appenders and layouts. Please note that some appenders may not work
 * depending on the JavaScript environment in which Woodman is run.
 *
 * The code of the different appenders and layouts is loaded using AMD,
 * and registered on the LogManager returned.
 *
 * Copyright (c) 2013 Joshfire
 * MIT license (see LICENSE file)
 */
/*global module*/

// Ensure "define" is defined in node.js in the absence of require.js
// See: https://github.com/jrburke/amdefine
if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([
  './logmanager',
  './appenders/consoleappender',
  './appenders/socketappender',
  './appenders/node.js/fileappender',
  './layout',
  './layouts/jsonlayout',
  './layouts/patternlayout'
], function (
  LogManager,
  ConsoleAppender,
  SocketAppender,
  FileAppender,
  Layout,
  JSONLayout,
  PatternLayout) {

  LogManager.registerAppender('console', ConsoleAppender);
  LogManager.registerAppender('ConsoleAppender', ConsoleAppender);

  LogManager.registerAppender('file', FileAppender);
  LogManager.registerAppender('FileAppender', FileAppender);

  LogManager.registerAppender('socket', SocketAppender);
  LogManager.registerAppender('SocketAppender', SocketAppender);

  LogManager.registerLayout('default', Layout);

  LogManager.registerLayout('json', JSONLayout);
  LogManager.registerLayout('JSONLayout', JSONLayout);

  LogManager.registerLayout('pattern', PatternLayout);
  LogManager.registerLayout('PatternLayout', PatternLayout);

  return LogManager;
});