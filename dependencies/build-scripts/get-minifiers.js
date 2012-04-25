/*jshint undef:true asi:true */
/*global module:false, require:false */

module.exports = function () {
	function dummy (str) {
		return str
	}

	var minifiers = {}

	try {
		minifiers.html = require('html-minifier').minify
	} catch (e) {
		minifiers.html = dummy
	}

	try {
		var jsp = require('uglify-js').parser
		var pro = require('uglify-js').uglify

		minifiers.js = function (str) {
			var ast = jsp.parse(str)
			ast = pro.ast_mangle(ast)
			ast = pro.ast_squeeze(ast)

			return pro.gen_code(ast)
		}
	} catch (e) {
		minifiers.js = dummy
	}

	try {
		minifiers.css = require('clean-css').process
	} catch (e) {
		minifiers.css = dummy
	}

	return minifiers
}
