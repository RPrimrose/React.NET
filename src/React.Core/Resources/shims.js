﻿/*
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant 
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

var global = global || {};
var React;

// Basic console shim. Caches all calls to console methods.
function MockConsole() {
	this._calls = [];
	['log', 'error', 'warn', 'debug', 'info', 'dir', 'group', 'groupEnd', 'groupCollapsed'].forEach(function (methodName) {
		this[methodName] = this._handleCall.bind(this, methodName);
	}, this);
}
MockConsole.prototype = {
	_handleCall: function(methodName/*, ...args*/) {
		var serializedArgs = [];
		for (var i = 1; i < arguments.length; i++) {
			serializedArgs.push(JSON.stringify(arguments[i]));
		}
		// Ignore "React.renderToString is deprecated" until there's a nice way to build a standalone
		// version of ReactDOMServer.
		if (arguments[1].indexOf('React.renderToString is deprecated') > -1) {
			return;
		}
		this._calls.push({
			method: methodName,
			args: serializedArgs
		});
	},
	_formatCall: function(call) {
		return 'console.' + call.method + '("[.NET]", ' + call.args.join(', ') + ');';
	},
	getCalls: function() {
		return this._calls.map(this._formatCall).join('\n');
	}
};
var console = new MockConsole();

if (!Object.freeze) {
	Object.freeze = function() { };
}

/**
 * Finds a user-supplied version of React and ensures it's exposed globally.
 *
 * @return {bool}
 */
function ReactNET_initReact() {
	if (typeof React !== 'undefined') {
		// React is already a global, woohoo
		return true;
	}
	if (global.React) {
		React = global.React;
		return true;
	}
	if (typeof require === 'function') {
		// CommonJS-like environment (eg. Browserify)
		React = require('react');
		return true;
	}
	// :'(
	return false;
}

function ReactNET_transform(input, babelConfig, filename) {
	babelConfig = JSON.parse(babelConfig);
	babelConfig.filename = filename;
	try {
		return global.babel.transform(input, babelConfig).code;
	} catch (ex) {
		// Parsing stack is extremely long and not very useful, so just rethrow the message.
		throw new Error(ex.message);
	}
}

function ReactNET_transform_sourcemap(input, babelConfig, filename) {
	babelConfig = JSON.parse(babelConfig);
	babelConfig.filename = filename;
	babelConfig.sourceMap = true;
	try {
		var result = global.babel.transform(input, babelConfig);
		return JSON.stringify({
			code: result.code,
			sourceMap: result.map
		});
	} catch (ex) {
		// Parsing stack is extremely long and not very useful, so just rethrow the message.
		throw new Error(ex.message);
	}
}