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
        ' MIT license */'
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
        src: ['<banner:meta.banner>', '<file_strip_banner:dist/woodman.js>'],
        dest: 'dist/woodman.js'
      },
      'woodman-amd': {
        src: ['<banner:meta.banner>', '<file_strip_banner:dist/woodman-amd.js>'],
        dest: 'dist/woodman-amd.js'
      },
      browser: {
        src: ['<banner:meta.banner>', '<file_strip_banner:dist/woodman-browser.js>'],
        dest: 'dist/woodman-browser.js'
      },
      'browser-amd': {
        src: ['<banner:meta.banner>', '<file_strip_banner:dist/woodman-browser-amd.js>'],
        dest: 'dist/woodman-browser-amd.js'
      },
      node: {
        src: ['<banner:meta.banner>', '<file_strip_banner:dist/woodman-node.js>'],
        dest: 'dist/woodman-node.js'
      },
      disabled: {
        src: ['<banner:meta.banner-disabled>', '<file_strip_banner:dist/woodman-disabled.js>'],
        dest: 'dist/woodman-disabled.js'
      }
    },

    /**
     * Woodman compilation task (using require.js optimizer)
     *
     * Distributions that are defined here:
     * - woodman: stand-alone distribution that includes all known appenders and
     * layouts. Some of them may not work depending on the environment. The
     * Woodman library is exposed as window.woodman (client-side) or
     * global.woodman (server-side), and as a named "woodman" AMD module if
     * possible.
     * - woodman-amd: same as above but the Woodman library is only available
     * as a "woodman" AMD module and not exposed as window.woodman or
     * global.woodman.
     * - browser: stand-alone distribution for browsers. The Woodman library is
     * exposed in window.woodman. Available appenders are those that work in Web
     * browsers.
     * - browser-amd: AMD distribution for browsers. AMD loader required to run.
     * - node: stand-alone compilation for execution in node.js. Available
     * appenders are those that work in the node.js environment.
     * - disabled: stand-alone distribution that includes the Woodman shim. The
     * shim is exposed as window.woodman (client-side) or global.woodman
     * (server-side), and as a named "woodman" AMD module if possible.
     */
    requirejs: {
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

      'woodman-amd': {
        options: {
          wrap: false,
          baseUrl: 'lib/',
          name: 'woodman',
          out: 'dist/woodman-amd.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      },

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

      'browser-amd': {
        options: {
          wrap: {
            start: '',
            end: 'define("woodman", ["./woodman-browser"], function (woodman) {' +
              ' return woodman; });'
          },
          baseUrl: 'lib/',
          name: 'woodman-browser',
          out: 'dist/woodman-browser-amd.js',
          preserveLicenseComments: false,
          optimize: 'uglify'
        }
      },

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
};