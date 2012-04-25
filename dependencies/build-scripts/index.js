/*jshint boss:true undef:true asi:true es5:true onecase:true */
/*global module:false, require:false, console:false */

var fs = require('fs')
var builderContext = require('./builder-context')
var getMinifiers = require('./get-minifiers')

var DEBUG = console.error.bind(console)

function path () {
	return [].slice.call(arguments).map(function (a) {
			return (/^(.+)\/?$/).exec(a)[1]
	}).join('/')
}

function extend (obj) {
	var i, n

	for (i=1; i<arguments.length; i++) {
		for (n in arguments[i]) {
			if (arguments[i].hasOwnProperty(n)) {
				obj[n] = arguments[i][n]
			}
		}
	}

	return obj
}

function ls (p, r) {
	p	= p instanceof Array ? path.apply(null, p) : p
	p	= fs.readdirSync(p)

	if (r) {
		for (var i=0; i<p.length; i++) {
			if (!r.exec(p[i])) {
				p.splice(i--, 1)
			}
		}
	}

	return p
}

function read (p, encoding) {
	p		= p instanceof Array ? path.apply(null, p) : p
	encoding	= encoding || 'UTF-8'

	return fs.readFileSync(p, encoding)
}

function save (p, data, encoding) {
	p		= p instanceof Array ? path.apply(null, p) : p
	encoding	= encoding || 'UTF-8'

	return fs.writeFileSync(p, data, encoding)
}

function logicalMods (obj, name, value) {
	if (arguments.length < 3) {
		value	= obj[name]
	}

	var	pos	= ['major', 'minor', 'patch']

	Object.defineProperty(obj, name, {
		set: function (val) {
			var	op	= typeof val === 'string' ? val.split(' ') : val
			var	r	= typeof value === 'string' ? value.split('.') : value
			var	n	= []

			if (op && op instanceof Array) {
				op.slice(1).forEach(function (o) {
					o = pos.indexOf(o)

					if (o !== -1) n.push(o)
				})

				if (!n.length) n.push(0)

				n.forEach(function (n) {
					switch (op[0]) {
					case 'increment':
						if (typeof r === 'number') {
							r++
						} else {
							r[n]++
						}

						val = r instanceof Array ? r.join('.') : r

						break
					case 'decrement':
						if (typeof r === 'number') {
							r--
						} else {
							r[n]--
						}

						val = r instanceof Array ? r.join('.') : r

						break
					}
				})
			}

			value = val
		},

		get: function () {
			return value
		}
	})
}

var createSettings = function () {
	var settings

	return function () {
		if (!settings) {
			settings = JSON.parse(read('templates/variables.json'))
		}

		var s =  extend({}, settings)

		logicalMods(s, 'version')

		return s
	}
}()

builderContext.createSettings = createSettings

var updatables = {
	'wrappers': function () {
		var builder = builderContext()

		ls('src', /^\w+$/).forEach(function (dir) {
			ls(['src', dir], /\.js$/i).forEach(function (f) {
				builder.run(read(['src', dir, f]), path(dir, f))
			})
		})

		ls('src', /^api-(\w+-?)+\.js$/).forEach(function (file) {
			builder.run(read(['src', file]), path('src', file))
		})

		save('src/wrapper-start.js', builder.run(read('templates/wrapper-start.js')))
		save('src/wrapper-end.js', builder.run(read('templates/wrapper-end.js')))

		DEBUG('BUILD: Wrappers updated.')
	},

	'package': function () {
		var builder = builderContext()

		save('package.json', builder.run(read('templates/package.json')))

		DEBUG('BUILD: package.json updated.')
	},

	'docs': function () {
		var builder = builderContext()

		ls('src', /^\w+$/).forEach(function (dir) {
			ls(['src', dir], /\.js$/i).forEach(function (f) {
				builder.run(read(['src', dir, f]), path(dir, f))
			})
		})

		ls('src', /^api-(\w+-?)+\.js$/).forEach(function (file) {
			builder.run(read(['src', file]), path('src', file))
		})

		builder.commentParser.comments.forEach(function (comment) {
			// This is probably unnecessary payload.
			delete comment.body
		})

		var minify = getMinifiers()

		var docs = JSON.stringify(builder.commentParser.comments)

		docs = read('templates/docs/docs.html').split('INSERT_DOCUMENTATION_HERE').join(docs)

		docs = docs.replace(/<script src="([^"]+)"><\/script>/g, function (tag, target) {
			switch (target) {
			case "docs.js":
				return '<script>' + minify.js(read('templates/docs/docs.js')) + '</script>'
			default:
				return tag
			}
		}).replace(/<link rel="stylesheet" href="([^"]+)" \/>/g, function (tag, target) {
			switch (target) {
			case "docs.css":
				return '<style>' + minify.css(read('templates/docs/docs.css')) + '</style>'
			default:
				return tag
			}
		})

		docs = minify.html(docs, {
			collapseWhitespace: true,
			removeAttributeQuotes:	true
		})

		save('lib/docs.html', docs)

		DEBUG('BUILD: Documentation updated.')
	}
}

/* exports */

var settings

module.exports = {
	builderContext : builderContext,
	getMinifiers : getMinifiers,
	updatables : updatables,

	get config () {
		if (!settings) {
			settings = createSettings()
		}

		return settings
	},

	set config (s) {
		settings = s
	},

	saveConfig: function () {
		save('templates/variables.json', JSON.stringify(this.config, null, '\t'));
	}
}
