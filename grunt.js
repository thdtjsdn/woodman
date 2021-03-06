/*global module:false*/
module.exports = function (grunt) {

  grunt.initConfig({
    /**
     * Variable initialized with the contents of the package.json file
     */
    pkg: '<json:package.json>',

    /**
     * Meta information used in different tasks
     */
    meta: {
      /**
       * Copyright and license banner
       */
      banner: '/*! Woodman - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> - ' +
        '<%= pkg.homepage %>\n' +
        'Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' MIT license\n' +
        'Based on log4j v2.0: http://logging.apache.org/log4j/2.x/\n' +
        'Portions adapted from log4javascript: http://log4javascript.org/ (copyright Tim Down, Apache License, Version 2.0) ' +
        '*/',
      'banner-disabled': '/*! Woodman - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> - ' +
        '<%= pkg.homepage %>\n' +
        'Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' MIT license */',
      full: '/* Full distribution */',
      amd: '/* Full distribution, AMD module */',
      browser: '/* Browser distribution */',
      'browser-amd': '/* Browser distribution, AMD module */',
      node: '/* Node.js distribution */',
      disabled: '/* Disabled distribution */'
    },
    lint: {
      files: [
        'grunt.js',
        'lib/**/*.js',
        'test/runner.js',
        'test/spec/*.js'
      ]
    },
    test: {
      files: [
        'test/**/*.js'
      ]
    },
    concat: {
      woodman: {
        src: [
          '<banner:meta.banner>',
          '<banner:meta.full>',
          '<file_strip_banner:dist/woodman.js>'
        ],
        dest: 'dist/woodman.js'
      },
      'woodman-amd': {
        src: [
          '<banner:meta.banner>',
          '<banner:meta.amd>',
          '<file_strip_banner:dist/woodman-amd.js>'
        ],
        dest: 'dist/woodman-amd.js'
      },
      browser: {
        src: [
          '<banner:meta.banner>',
          '<banner:meta.browser>',
          '<file_strip_banner:dist/woodman-browser.js>'
        ],
        dest: 'dist/woodman-browser.js'
      },
      'browser-amd': {
        src: [
          '<banner:meta.banner>',
          '<banner:meta.browser-amd>',
          '<file_strip_banner:dist/woodman-browser-amd.js>'
        ],
        dest: 'dist/woodman-browser-amd.js'
      },
      node: {
        src: [
          '<banner:meta.banner>',
          '<banner:meta.node>',
          '<file_strip_banner:dist/woodman-node.js>'
        ],
        dest: 'dist/woodman-node.js'
      },
      disabled: {
        src: [
          '<banner:meta.banner-disabled>',
          '<banner:meta.disabled>',
          '<file_strip_banner:dist/woodman-disabled.js>'
        ],
        dest: 'dist/woodman-disabled.js'
      }
    },

    /**
     * Woodman compilation task (using require.js optimizer)
     *
     * There are a number of distributions available. Differences between
     * distributions include:
     * - the list of appenders and layouts supported by default
     * - how the Woodman library gets exposed to the global scope
     * (global variable, named AMD module, anonymous AMD module)
     */
    requirejs: {
      /**
       * Global standalone distribution that includes all known appenders and
       * layouts. Some of them may not work depending on the environment under
       * which the distribution is run.
       *
       * The Woodman library is exposed as window.woodman (client-side) or to
       * global "this" scope (node.js module) and as a named "woodman" AMD
       * module if "define" is defined.
       *
       * Note the "require" call with the fourth parameter set to "true" to
       * force synchronous load of modules.
       */
      woodman: {
        options: {
          wrap: {
            start: 'if ((typeof module !== "undefined") && ' +
              'module.exports && (typeof define !== "function")) {' +
              ' var define = require("amdefine")(module);' +
              '}\n' +
              '(function(root, rootdefine) {',
            end: 'require(["./woodman"], function (woodman) {\n' +
              ' if (rootdefine) rootdefine(woodman);\n' +
              ' if (root) root.woodman = woodman;\n' +
              '}, null, true);\n' +
              '}((typeof window !== "undefined") ? window : this,' +
              ' (typeof define === "function") ? define : null));'
          },
          baseUrl: 'lib/',
          name: '../deps/almond',
          include: [ 'woodman' ],
          out: 'dist/woodman.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      },

      /**
       * Same as above but the Woodman library is only exposed as an anonymous
       * AMD module.
       *
       * In particular, the library does not leak anything to the global scope
       * in that distribution (but "define" needs to be defined).
       */
      'woodman-amd': {
        options: {
          wrap: {
            start: 'define([], function () {\n',
            end: ' var woodman = null;\n' +
              ' require(["./woodman"], function (wood) {\n' +
              '  woodman = wood;\n' +
              ' }, null, true);\n' +
              ' return woodman;\n' +
              '});'
          },
          baseUrl: 'lib/',
          name: '../deps/almond',
          include: [ 'woodman' ],
          out: 'dist/woodman-amd.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      },

      /**
       * Standalone distribution for browsers. Available appenders are those
       * that run in Web browsers.
       *
       * The Woodman library is exposed as window.woodman in that distribution.
       */
      browser: {
        options: {
          wrap: {
            start: '(function() {',
            end: 'require(["./woodman-browser"], function (woodman) {' +
              ' window.woodman = woodman; }, null, true);' +
              '}());'
          },
          baseUrl: 'lib/',
          name: '../deps/almond',
          include: [ 'woodman-browser' ],
          out: 'dist/woodman-browser.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      },

      /**
       * Same as above but the Woodman library is only exposed as an anonymous
       * AMD module.
       *
       * In particular, the library does not leak anything to the global scope
       * in that distribution (but "define" needs to be defined).
       */
      'browser-amd': {
        options: {
          wrap: {
            start: 'define([], function () {\n',
            end: ' var woodman = null;\n' +
              ' require(["./woodman-browser"], function (wood) {\n' +
              '  woodman = wood;\n' +
              ' }, null, true);\n' +
              ' return woodman;\n' +
              '});'
          },
          baseUrl: 'lib/',
          name: '../deps/almond',
          include: [ 'woodman-browser' ],
          out: 'dist/woodman-browser-amd.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      },

      /**
       * Standalone compilation for execution in node.js. Available appenders
       * are those that run in the node.js environment.
       *
       * The Woodman library is exposed as a regular node.js module.
       */
      node: {
        options: {
          wrap: {
            start: '',
            end: 'require(["./woodman-node"], function (woodman) {' +
              ' module.exports = woodman; }, null, true);'
          },
          baseUrl: 'lib/',
          name: '../deps/almond',
          include: [ 'woodman-node' ],
          out: 'dist/woodman-node.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      },

      /**
       * Global standalone distribution that only includes Woodman's "disabled"
       * shim, for use in production environments instead of the generic Woodman
       * distribution to suppress all traces.
       */
      disabled: {
        options: {
          wrap: {
            start: '(function(root, rootdefine) {\n' +
              'var woodman = null;\n' +
              'var define = function (name, deps, fn) { woodman = fn(); };\n',
            end: '\n' +
              'if (rootdefine) rootdefine("woodman", woodman);\n' +
              'else if ((typeof module !== "undefined") && module.exports) {\n' +
              ' rootdefine = require("amdefine")(module);\n' +
              ' rootdefine(woodman);\n' +
              '}\n' +
              'if (root) root.woodman = woodman;\n' +
              '}((typeof window !== "undefined") ? window : this,' +
              ' (typeof define === "function") ? define : null));'
          },
          baseUrl: 'lib/',
          name: 'woodman-disabled',
          out: 'dist/woodman-disabled.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      }
    },

    watch: {
      files: '<config:lint.files>',
      tasks: 'lint test'
    },

    jshint: {
      options: {
        "indent": 2,
        "evil": true,
        "regexdash": true,
        "browser": true,
        "wsh": false,
        "trailing": true,
        "sub": true,
        "undef": true,
        "eqeqeq": true,
        "unused": true,
        "predef": [
          "require",
          "define"
        ]
      },
      globals: {}
    },

    uglify: {}
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('build', 'requirejs concat');
  grunt.registerTask('default', 'build');
};
