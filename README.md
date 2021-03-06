# Woodman

**Important:** as of May 2013, the documentation is not yet complete.

Woodman is a JavaScript logger utility that follows the architecture, terminology and API (where applicable) of the [log4j v2](http://logging.apache.org/log4j/2.x/) Apache project. In particular, Woodman features:
- a **logger hierarchy** to organize traces and disable log statements based on their module of origin.
- **trace levels** similar to those exposed by the `console` object (log, info, warn, error)
- **appenders** that allow to change the destination where a log event gets sent (the `console` comes in mind, but other destinations such as a rotating log file or a remote server using Web sockets are possible). New appenders can easily be created.
- **layouts** to specify the format and structure (raw string, CSV, JSON, XML, whatever) of the log events sent to an appender. New layouts can easily be created.
- **filters** for more flexibility in the rules that determine which log events get sent to an appender and which are ignored.

Woodman also includes a **precompiler** to remove all traces of Woodman from a given JavaScript file. This is typically useful to build a version of an app that runs in a production environment where logging is not needed, where bytes are a scarce resource or where performances need to be at their best.

Woodman runs in Web browsers and in node.js applications. The main distribution exposes a global `woodman` object if `window` is defined, a node.js module if `module.exports` is defined, and an AMD module if the `define` function is defined. Other distributions that do not make assumptions about the underlying JavaScript runtime are available.


## <a id="toc"></a>Table of Contents

- [Getting started](#getting-started)
  - [Using Woodman in a node.js application](#using-woodman-in-a-nodejs-application)
  - [Using Woodman in a Web browser](#using-woodman-in-a-web-browser)
  - [Using Woodman as an AMD module](#using-woodman-as-an-amd-module)
  - [Trace functions](#trace-functions)
- [Basic concepts and classes](#basic-concepts-and-classes)
  - [Logger](#logger)
  - [Log Event](#log-event)
  - [Appender](#appender)
  - [Filter](#filter)
  - [Layout](#layout)
- [Woodman configuration](#woodman-configuration)
  - [Configuration outline](#configuration-outline)
  - [Logger definition](#logger-definition)
  - [Appender definition](#appender-definition)
  - [Layout definition](#layout-definition)
  - [Filter definition](#filter-definition)
  - [Log4j JSON configuration format](#log4j-json-configuration-format)
- [Precompilation](#precompilation)
- [Available distributions](#available-distributions)
- [Development](#development)
- [About](#about)
  - [Who](#who)
  - [Why?!?](#why)
  - [Differences with log4j](#differences-with-log4j)
  - [Other JavaScript logging libraries](#other-javascript-logging-libraries)
  - [License](#license)
- [Changelog](#changelog)


## Getting started

### Using Woodman in a node.js application
Woodman is available as an npm package. To install Woodman in your node.js application:
```
npm install woodman
```

Woodman needs to be initialized before it may be used. Note this initialization process is asynchronous because appenders may need to setup network connections or execute similar I/O operations.
```javascript
var woodman = require('woodman');
var config = {}; // See below for details about configuration
woodman.load(config, function (err) {
  if (err) {
    // An error either means the configuration is incorrect
    // or that an I/O operation failed
  }
  // Woodman is up and running
});
```

The call to `woodman.load` needs to appear **only once** in your application. To use Woodman throughout your application once that is done:

1. import Woodman with a call to `require` if not already done
2. retrieve the instance of `Logger` for this module (the name implicitly creates a hierarchy among loggers, see below for details)
3. log events!

```javascript
var woodman = require('woodman');
var logger = woodman.getLogger('path.name');
logger.log('This is a log message at the log level');
```

For a running example, check the [standalone example](examples/node.js/standalone.js) which may be run with:
```
node examples/node.js/standalone.js
```

### Using Woodman in a Web browser
Using Woodman in a Web browser is essentially the same as using Woodman in a node.js application. To install Woodman, copy the `dist/woodman.js` file of this project to the JavaScript folder of your Web application (or [download the file](https://raw.github.com/joshfire/woodman/master/dist/woodman.js). Reference that file from a `script` tag in the HTML page (the tag needs to appear before all scripts that make use of Woodman):
```html
<script type="text/javascript" src="path-to-js/woodman.js"></script>
```

The rest is pretty similar to the node.js case, except `woodman` is exposed as a global object. In particular, initialize Woodman once before use:
```javascript
var config = {}; // See below for details about configuration
woodman.load(config, function (err) {
  if (err) {
    // An error either means the configuration is incorrect
    // or that an I/O operation failed
  }
  // Woodman is up and running
});
```

Then, from any JavaScript file that composes your app:
```javascript
var logger = woodman.getLogger('path.name');
logger.log('This is a log message at the log level');
```

See the [examples/browser] folder for further examples.

### Using Woodman as an AMD module
Woodman exports itself as a module named `woodman` if the `define` function is defined. For instance, to define a module that depends on Woodman:
```javascript
define(['woodman'], function (woodman) {
  var logger = woodman.getLogger('loggername');
  logger.log('Using Woodman in an AMD module');
});
```

As above, the library needs to be initialized once before it may be used, typically in the first module that gets executed (in a Web browser) or within the first call to `requirejs` (in a node.js application):

```javascript
requirejs(['woodman'], function (woodman) {
  var config = {};  // See below for details about configuration
  woodman.load(config, function (err) {
    if (err) throw err;
    var logger = woodman.getLogger('main');
    logger.log('Yeepee');
  });
});
```

### Trace functions
Call the `log`, `info`, `warn`, `error` trace functions on a Logger instance to log a message. They mostly behave as those of the usual `console` object, meaning that they can take any number of arguments of basically any type.

There are a couple of differences though:

1. Woodman produces strings. If you pass an object, Woodman will not output the object itself but a serialization of that object as a string. Depending on whether the object overrides "toString", the serialization is either the result of running "toString" or a JSON serialization of the first levels of the object.

2. If the first parameter is a string, Woodman replaces the occurrences of `{}` in that string with the string serialization of the remaining parameters.

The code below illustrates these possibilities:

```javascript
var woodman = require('woodman');
var logger = woodman.getLogger('path.name');

logger.log('This is a log message at the log level');
logger.info('This is a log message at the info level');
logger.warn('This is a log message at the warn level');
logger.error('This is a log message at the error level');

logger.log('Logging', 'multiple', 'parameters', 'is', 'easy');
logger.log('Logging', { name: 'objects' }, 'as well');
logger.log('Woodman supports {} {}', 'parameters', 'substitution');
```


## Basic concepts and classes

### Logger
The Logger class is the *one* class you will interact with in your code. It exposes the trace functions that you will call to log messages.

A Logger has a name, a level, and may link to a list of Appenders and a Filter. Appenders and Filters are created once and for all when the [Woodman configuration](#Woodman_configuration) is loaded. Your code will never have to deal with Appenders and Filters directly in particular, only through configuration directives.

The names of the Logger implicitly create a Logger hierarchy: a logger is an ancestor of another one when its name followed by a dot is a prefix of the other logger name (e.g. a Logger named `daddy` is an ancestor of one named `daddy.baby`). Woodman maintains a root logger named `[root]` at the top of the hierarchy.

Although not a requirement, applications will typically instantiate one Logger per module to be able to filter logs based on their module of origin. It is perfectly ok to create more than one Logger per module although note that Woodman keeps a pointer on all created Logger instances, so you should not instantiate too many of them (for instance, it is likely not a good idea to have a `for` loop that runs thousands of times and creates one Logger at each iteration). You may also decide to maintain and use only one Logger throughout the application but note that kind of kills to possibility to filter out log events that makes Woodman useful in the first place.

### Log event
A LogEvent is the object created internally when the user issues a call to one of a Logger's trace functions. It contains the actual message sent to the trace function as well as meta-information such as the current date, the name of the Logger that created it or the trace level.

Appenders, Filters and Layouts all operate on an instance of the LogEvent class.

### Appender
Appenders are responsible for delivering LogEvents to their destination. The Console Appender is the main appender that more or less all applications will use. Other possibilities such as logging to a file or sending events to a remote server over Web sockets are possible, although note Woodman only ships with a couple of Appenders for the time being.

### Filter
Filters allow LogEvents to be evaluated to determine whether they should be published. Filtering rules depend on the type of Filter being used. A typical Filter is the RegexFilter that applies a regular expression to the formatted message of a LogEvent and takes a decision based on whether the regular expression matched or not. The decision may either be *accept* to accept the log event right away, *deny* to reject the log event altogether, or *neutral* to leave the decision to further filters.

As explained in the [log4j documentation](http://logging.apache.org/log4j/2.x/manual/filters.html), filters may be attached to different locations:

* Context-wide Filters run before all the other filters. Events that are rejected by these filters will not be passed to loggers for further processing. Once an event has been accepted by a Context-wide filter it will not be evaluated by any other Context-wide Filters nor will the Logger's Level be used to filter the event. The event will be evaluated by Logger and Appender Filters however.
* Logger Filters are configured on a specified Logger. These are evaluated after the Context-wide Filters and the Log Level for the Logger. Events that are rejected by these filters will be discarded and the event will not be passed to a parent Logger regardless of the additivity setting.
* Appender Filters are used to determine if a specific Appender should handle the formatting and publication of the event.

(Note Woodman does not support Appender Reference Filters)

### Layout
A Layout formats a LogEvent into a form that meets the needs of an Appender, in most cases a string. The formatted form depends on the type of Layout. A typical example is the PatternLayout that takes a pattern string and formats a LogEvent according to follow that pattern. Other Layouts are possible although note Woodman only ships with a couple of Layouts for the time being.


## Woodman configuration

In the absence of a proper configuration, calls to trace functions will not produce anything. To actually start logging something somewhere, you need to specify **what**, **how** and **where** to log events. This is all done through the configuration of Woodman, defined in declarative JavaScript object that can be serialized as JSON. You will typically load le configuration object once and for all when your application is started with code such as:

```javascript
// Initialize Woodman configuration
var config = {
  "loggers": [
    {
      "root": true,
      "level": "log",
      "appenders": [
        {
          "type": "Console"
        }
      ]
    }
  ]
};

// Load the configuration
woodman.load(config, function (err) {
  if (err) {
    // Woodman could not apply the configuration
    throw err;
  }

  // Main code of your application
});
```

### Configuration outline

Loggers are at the heart of the configuration of Woodman. The `loggers` property is the only property required in the configuration. It contains a list of Logger definitions. If you want to add a bunch of context-wide filters, you may also add a `filters` property that contains a list of Filter definitions. If you need to share appenders between loggers, add an `appenders` property with a list of Appender definitions and reference the names of these appenders from within the `appenders` property of the Logger definition.

The following is an example of a configuration object that creates a console appender, a socket appender, a context-wide filter that rejects all log events whose messages contain the word *dummy*, and logging rules for different families of loggers:

```json
{
  "appenders": [
    {
      "name": "theconsole",
      "type": "Console",
      "layout": {
        "type": "PatternLayout",
        "pattern": "%message"
      }
    },
    {
      "name": "socketserver",
      "type": "Socket",
      "url": "http://socketserver.example.org",
      "level": "error",
      "layout": {
        "type": "JSONLayout"
      }
    }
  ],
  "filters": [
    {
      "type": "RegexFilter",
      "regex": "(^|\\s)dummy(\\s|$)",
      "match": "deny",
      "mismatch": "neutral"
    }
  ],
  "loggers": [
    {
      "root": true,
      "level": "log",
      "appenders": [
        "socketserver"
      ]
    },
    {
      "name": "base",
      "level": "info",
      "appenders": [
        "theconsole"
      ]
    },
    {
      "name": "base.lib.unstable",
      "level": "log"
    }
  ]
}
```

To understand what happens when Woodman loads that configuration, keep the following bullet points in mind:

1. Logger names create a hierarchy of loggers, the root Logger being the common ancestor of all loggers. If the code uses a logger whose name does not appear in the configuration, it inherits its level and filter from its closest ancestor that appear in the configuration.
1. Loggers are additive by default, meaning that, provided a log event passes the level and filter criteria of the Logger, the log event is sent to all the appenders of the Logger ancestors (no matter the level and filter they may define).
1. Levels and filters specify the **what** to log.
1. The appenders specificy the **where** to send log events.
1. The layouts specificy the **how** to format log events.

The best is then to take a few examples of calls to trace functions:
- `woodman.getLogger('foo').warn('Woodman is great')` does not log anything: the closest ancestor of the `foo` Logger in the configuration is the root Logger which logs everything but the log event eventually gets filtered by its appender which only logs errors.
- `woodman.getLogger('foo').error('Woodman is great')` sends the log event to the socket appender as a JSON structure.
- `woodman.getLogger('foo').error('Oh no, a dummy message!')` does not log anything: the context-wide filter detects *dummy* in the message and rejects the log event.
- `woodman.getLogger('base').warn('Woodman is great')` logs the message to the console.
- `woodman.getLogger('base.lib.unstable').log('Woodman is great')` logs the message to the console: the trace level for the `base.lib.unstable` Logger is `log`; the appender of the `base` Logger gets called through additivity. Note the appender of the root Logger gets called as well but it does not log anything since the log event is above the error level.
- `woodman.getLogger('base.lib.something').error('Woodman is great')` logs the message to the console and sends the error to the socket appender as a JSON structure.

Do not worry if that sounds far-fetched at first sight. First, this mechanism is not complex for the sake of being complex: it gives you precise control over the treatment of log events. Second, you will likely just start with a simple *log everything to the console* configuration and adjust settings as your project grows and your needs evolve. More importantly, you'll get used to it ;)

### Logger definition

A Logger definition contains one or more of the following properties:

* `additivity`: A boolean flag that determines whether the Logger is additive. Loggers are additive by default. An additive Logger sends the log event it processes to the appenders of its ancestor (up until the root Logger or the first non additive Logger).
* `appenders`: The list of appenders directly associated with the Logger. See [Appender definition](#appender-definition) for details. The list may be empty.
* `filters`: The list of filters to apply to log events (provided that they are at the right level) to determine whether the Logger processes it. See [Filter definition](#filter-definition) for details. The order of the filters in the list determines the order of application. If not specified in the configuration, the list of filters is inherited from the closest ancestor of the Logger in the configuration.
* `level`: The trace level of the Logger. Log events above that level are rejected. Possible values are `all`, `log`, `info`, `warn`, `error` and `off`. If not specified in the configuration, the trace level is inherited from the closest ancestor of the Logger that specifies a trace level in the Logger hierarchy.
* `name`: The name of the Logger. A string. The property is required except if the `root` property is `true`. Dots in the name are used to build the hierarchy of Loggers.
* `root`: A special flag that identifies the root Logger. If this flag is set, the `name` property must not be set. The root Logger can appear at most once in the configuration.

The following configuration defines a Logger that sends log events at or below the `info` level to the console, except when the message to log contains the word `dummy`. Log events are formatted using the specified pattern:

```json
{
  "name": "path.name",
  "level": "info",
  "appenders": [
    {
      "type": "Console",
      "layout": {
        "type": "PatternLayout",
        "pattern": "%date [%level] %logger - %message%n"
      }
    }
  ],
  "filters": [
    {
      "type": "RegexFilter",
      "regex": "(^|\\s)dummy(\\s|$)",
      "match": "deny",
      "mismatch": "neutral"
    }
  ]
}
```

### Appender definition

An Appender definition contains one or more of the following properties:

* `appendStrings`: Boolean flag that determines whether to log a string formatted from the log event, or the log event itself as an object. Default value is `true`.
* `filters`: The list of filters to apply to log events (provided that they are at the right level) to determine whether the Appender processes it. See [Filter definition](#filter-definition) for details. The order of the filters in the list determines the order of application.
* `layout`: The layout used by the Appender. The property is required. See [Layout definition](#layout-definition) for details.
* `level`: The trace level of the Appender. Log events above that level are rejected. Possible values are `all`, `log`, `info`, `warn`, `error` and `off` (although note the `off` value is kind of stupid since it basically creates an Appender that does not log anything).
* `type`: The type of the Appender. The property is required. Possible values are `Console` to log events to the console, `Socket` to send log events to a remote Web socket server. More types may be added in the future (see [Add a new Appender](#add-a-new-appender) for details).
* `url`: The URL of the Web socket server. The property is required for a Socket Appender, meaningless otherwise.

Here is an example of a possible Woodman configuration for an appender that sends error messages to a Web socket server as JSON objects provided the error message starts with "Alert ze world":

```json
{
  "type": "Socket",
  "url": "http://socketserver.example.org",
  "level": "error",
  "layout": {
    "type": "JSONLayout"
  },
  "filters": [
    {
      "type": "RegexFilter",
      "regex": "^Alert ze world"
      "match": "accept",
      "mismatch": "neutral"
    }
  ]
}
```

### Layout definition

A Layout definition contains a `type` property that specifies the type of Layout to use to format the underlying log event. Possible values are `JSONLayout` to log events in a JSON structure and `PatternLayout` to format log events according to a pattern string. More types may be added in the future (see [Add a new Layout](#add-a-new-layout) for details).

Other properties depend on the type of Layout.

#### JSONLayout

A `JSONLayout` formats a log event as a JSON structure. The following properties may be set to fine-tune how the formatting is achieved:

* `compact`: A boolean that determines whether the resulting JSON string is compact or more human readable with tabs and carriage returns. Default value is `false`.
* `depth`: The depth at which to serialize the message of a log event is the `messageAsObject` flag is set. Default value is `2`.
* `messageAsObject`: Whether to format the message of a log event as an object or as a string. Default value is `false`.

#### PatternLayout

A `PatternLayout` formats a log event as a string that follows a pattern string. The following properties may be set:

* `pattern`: The pattern string used to format the log event. See below for details.
* `compactObjects`: A boolean flag that determines whether to serialize objects using a compact form. Default value is false.

The pattern string is composed of literal text and format control expressions called conversion specifiers. A conversion specifier starts with a `%` and is followed by optional *format modifiers* and a *conversion pattern*.

Note that any literal text may be included in the conversion pattern.

The *conversion patterns* supported by the pattern string are based on those defined by the [log4j documentation](http://logging.apache.org/log4j/2.x/manual/layouts.html#PatternLayout), but note Woodman only supports the following conversion patterns:

* `c` or `logger`: The name of the Logger
* `d` or `date`: The date of the log event. The actual date format to use may specified in a following set of braces, with predefined values `ABSOLUTE`, `COMPACT`, `DATE`, `ISO8601` and `ISO8601_BASIC`. You may also define formats such as `dd MMM yyyy HH:mm:ss,SSS`.
* `highlight`: To add colors based on the current log event. Colors are added to the pattern string enclosed in a following set of braces, e.g. `%highlight{%level %message}`.
* `m` or `message`: The log event message.
* `n`: A newline.
* `p` or `level`: The level of the log event.
* `r` or `relative`: The number of milliseconds elapsed since the application started.
* `%`: The percent sign (i.e. `%%` will produce a single percent sign).

The *format modifiers* control such things as field width, padding, left and right justification. Given a conversion specifier `%-10.25logger`, the layout formats the name of the logger as follows:

1. If the name is less than `10` characters long, the name is right padded with spaces (right because of the initial `-`, it would be left padded in the absence of that character)
1. If the name is more than `25` characters long, the name is truncated.

All parts are optional. For instance you may specify `%.25logger` to keep only the truncation at 25 characters, or `%15logger` to left pad with spaces when the name is less than 15 characters long.

The following definition describes a possible `PatternLayout`:

```json
{
  "type": "PatternLayout",
  "pattern": "%date{COMPACT} %highlight{%-5level} [%logger] - %message%n"
}
```

### Filter definition

A Filter definition contains a `type` property that specifies the type of Filter to use to filter the underlying log event. The only possible value is `RegexFilter` for the time being to filter log events based on whether the log event message matches a regular expression.

Properties that may be set for a `RegexFilter` filter are:
* `regex`: The regular expression.
* `match` or `onMatch`: The decision to take when the regular expression matches the message. Possible values are `accept`, `deny` or `neutral`. Default value is `neutral`.
* `mismatch` or `onMismatch`: The decision to take when the regular expression does not match the message. Same possible values as the `match` property. Default value is `deny`.
* `useRawMsg`: If true the regular expression will match the format string of the log event if there is one, otherwise the formatted message will be used. The default value is `false`.

Here is an example

```json
{
  "type": "RegexFilter",
  "regex": "(^|\\s)borked(\\s|$)",
  "match": "deny",
  "mismatch": "neutral"
}
```

### Log4j JSON configuration format

If you are familiar with log4j, you may have noticed that Woodman's JSON configuration takes some leeway with log4j's [JSON Configuration](http://logging.apache.org/log4j/2.x/manual/configuration.html#JSON). In log4j, the JSON configuration is a direct translation of the XML configuration (where XML tags become property keys). Woodman JSON configuration is intended to be more natural to write for people used to JSON.

That said, Woodman also supports the log4j JSON configuration format, meaning that you may use Appender Filter or Layout types as property keys, if you so wish and start your configuration object with a `configuration` root. For instance, the configuration example presented earlier may also be written as:

```json
{
  "configuration": {
    "appenders": {
      "Console": {
        "name": "theconsole",
        "PatternLayout": {
          "pattern": "%message"
        }
      },
      "Socket": {
        "name": "socketserver",
        "url": "http://socketserver.example.org",
        "level": "error",
        "JSONLayout": {}
      }
    },
    "filters": {
      "RegexFilter": {
        "regex": "(^|\\s)dummy(\\s|$)",
        "match": "deny",
        "mismatch": "neutral"
      }
    },
    "loggers": {
      "root": {
        "level": "log",
        "appender-ref": {
          "ref": "socketserver"
        }
      },
      "logger": [
        {
          "name": "base",
          "level": "info",
          "appender-ref": {
            "ref": "theconsole"
          }
        },
        {
          "name": "base.lib.unstable",
          "level": "log"
        }
      ]
    }
  }
}
```


## Precompilation

When you package your application for release, you may not want that version to log anything, be it only because it is quite useless to log things to a destination that no one will ever see. While it's easy to silence Woodman, leaving the calls to Woodman in the code has a couple of drawbacks:

* Size often matters for a release version. You will typically run a JavaScript minifier to shrink the size of the code to a bare minimum before release. Calls to Woodman take up useful bytes for just about nothing.
* Speed matters as well and calls to Woodman are regular JavaScript function calls that consume a little bit of time and memory even when they do not do anything.

Not being able to remove logs from the code is probably one of the reasons why most JavaScript libraries do not contain logging traces in the first place. Woodman would not be *that* useful if it could not address that issue. Fortunately, it can!

The *precompiler* can strip your code of all references to Woodman.

### Run the precompiler
To run the precompiler on a JavaScript file, run the following node.js command:

```
node {PATH TO WOODMAN}/precompile/precompiler.js {JSFILE}
```

This will output the resulting code directly to the console. To output the result to a named file, simply redirect the console to a file or provide an output file:

```
node {PATH TO WOODMAN}/precompile/precompiler.js {JSFILE} {OUTPUTJSFILE}
```

This may take up some time, from a couple of seconds for small JavaScript files up to a minute or so for large JavaScript files.

The precompiler can also process recursively all JavaScript files in a folder and create a similar folder structure where all JavaScript files have been precompiled:
```
node {PATH TO WOODMAN}/precompile/precompiler.js {JSFOLDER} {OUTPUTFOLDER}
```

### What the precompiler does

The precompilation:

- removes references to Woodman in AMD define calls, e.g.:
  `define(['woodman'], function (woodman) { ... });`
- removes references to Woodman in node.js require calls, e.g.:
  `var woodman = require('woodman');`
- removes calls to `woodman.load` or `woodman.start`, replacing it by a call to its callback argument directly
- removes calls such as `var logger = woodman.getLogger()`, dropping the variable declaration along the way
- removes calls to `logger.*` where `logger` is the variable name defined as the result of a call to `woodman.getLogger()`
- removes the configuration definition used in the call to `woodman.initialize` or `woodman.load`

### Limits of the precompiler
If you are familiar with what an *Abstract Syntax Tree (AST)* is, you probably know that manipulating JavaScript code to produce a slightly modified version of that code is not an easy task. While the precompilation process should account for all usual uses of the Woodman library, it does have its limits.

Here are examples of code correctly handled by the precompilation:

```javascript
// Logger variable defined and assigned on different lines
// (but note the variable declaration is not removed in that case)
var logger;
logger = woodman.getLogger('foo');

// Logger variable defined with another name
var anotherLogger = woodman.getLogger('foo');

// Logger variable defined with along with other variables
// (the function keeps the variable but nulls it in that case)
var logger = woodman.getLogger('foo'), j=3;

// Logger used directly
woodman.getLogger('foo').log('info');
```

Some cases that are not correctly handled by the precompilation function,
and that may generate invalid code in the end:

```javascript
// Calling a trace function within another statement
var l = logger.log('info');
if (logger.log('info')) {}

// Assigning the logger to another variable
var logger = woodman.getLogger('foo');
truc = logger;
truc.log('info');

// Re-assigning the logger variable
var logger = woodman.getLogger('foo');
logger = somethingelse;
logger.machin = 4;

// Not using the dot notation to call Logger functions
var logger = woodman.getLogger('blah');
logger\['info'\]('Oh no!')
```

Internally, Woodman's precompiler uses [esprima](http://esprima.org/) to produce the AST and an adapted version of [falafel](https://github.com/substack/node-falafel) to update the code.

## Available distributions
### Main distribution
### AMD module
### Web Browser AMD
### Web Browser
### The "disabled" distribution
### node.js module


## Development
### Codebase
#### Architecture
#### Run tests
#### Build Woodman

### Extend
#### Add a new Appender
#### Add a new Layout
#### Add a new Filter
#### Custom log levels
#### Compile a custom build

### Contribute to Woodman


## About

### Who
Woodman has been manufactured on the assembly line by [Joshfire Factory](http://factory.joshfire.com) workers to help develop and maintain various cross-device Web applications and other backend tools.

### Why?!?
"Surely, you've heard about that thing called `console`?", you may ask. "Wake up, this is *JavaScript*, not *Java*!", you might add. Yes indeed! The `console` is extremely useful to debug an application. It is not quite enough, mainly because:
- No all devices expose a `console` object. Perhaps surprisingly, the devices that do not are the ones that you might want to support to surf the HTML5-in-all-the-things wave. For instance, many connected TVs do not expose a debugging environment. Using `console` calls is simply not an option on such devices.
- Maintenance of a complex application often involves focusing on a specific part of it. To help debugging, you often need to see the *right* logs in your console, meaning those from the specific part you're looking at and not from other parts of the application that just add noise. The `console` is all-or-nothing, you cannot disable logs from certain parts of your application
without actually removing them from the code.
- At pre-production phase, you may want to hand over your application to beta testers and monitor usage remotely to be able to track down issues they may report. You need to save logs to a file or to send them to a remote log server. Said differently, you need to re-route the console to some other destination.

In the end, `console` is underused in most JavaScript applications. More precisely, most applications are written *without* log traces; `console` statements are only ever used temporarily to nail down specific issues at debug phase, or to report errors.

The [log4j introduction](http://logging.apache.org/log4j/2.x/manual/index.html) provides a handful of reasons why flexible logging is useful. These reasons are valid whether the underlying language is Java, JavaScript, C, Python...

In the end, log4j provides a very good abstraction over `console` that solves the problems raised above for a reasonable cost: that of having to manage a `Logger` instance per module.

### Differences with log4j

* Restricted number of Appenders available
* Restricted number of Layouts available
* Restricted number of Filters available
* No support for Appender Reference Filters
* No support for Markers
* No support for Plugins
* Functions may not have the right signature to stick to more
JavaScript-friendly paradigms

### Other JavaScript logging libraries

Woodman is not the first logging library written in JavaScript. [Winston](https://github.com/flatiron/winston) is a good example of a logging library for node.js. Closer to Woodman, the
[log4javascript](http://log4javascript.org/) library is a nice and complete implementation of log4j for Web browsers (and can easily be adapted to run in node.js applications).

We decided to start over because we needed:
- an implementation that takes a declarative configuration object as input and sets up loggers, appenders and layouts accordingly;
- an implementation that both runs in Web browsers and in node.js, using an AMD loader or not;
- code modularization, one file per class to be able to create custom builds of Woodman with selected appenders and layouts.
- a clean and small public interface to ease the work of the precompiler

### License

The Woodman library is licensed under the [MIT license](https://raw.github.com/joshfire/woodman/master/LICENSE).

The Woodman library uses, extends or was at least partially based on other great open-source projects:
- [RequireJS](http://requirejs.org/), [new BSD or MIT licensed](https://github.com/jrburke/requirejs/blob/master/LICENSE)
- [Almond](https://github.com/jrburke/almond), [new BSD or MIT licensed](https://github.com/jrburke/almond/blob/master/LICENSE)
- [log4javascript](http://log4javascript.org/), [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
- and obviously [log4j](http://logging.apache.org), [Apache License, Version 2.0](http://logging.apache.org/log4j/2.x/license.html)


## Changelog

@@TODO