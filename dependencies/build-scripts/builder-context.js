/*jshint boss:true undef:true asi:true */
/*global module:false, require:false */

var Builder = require('script-builder')

function builderContext (s) {
	s = s || builderContext.createSettings()

	Builder.Comment.prototype.toString = function () {
		return this.assignName || this.name || Object.prototype.toString.call(this)
	}

	var builder = Builder.Builder(s)
	var cp = Builder.CommentParser()

	function group (name) {
		if (arguments.length > 1) group.apply(this, [].slice.call(arguments, 1))

		var g	= builder.variables[name + 's'] = []
		var sg	= builder.variables['sub' + name + 's'] = []

		builder.instructions.push({
			name:	name,
			exec:	function (args) {
				args = args.split(/\s+/g)
				args[1] = args[1] || args[0]

				builder.variables[name + 's'].push({
					name: args[0],
					assignName: args[1]
				})
			}
		}, {
			name:	'sub' + name,
			exec:	function (args) {
				args = args.split(/\s+/g)
				args[2] = args[2] || args[0] + args[1]

				builder.variables['sub' + name + 's'].push({
					subOf: args[0],
					name: args[1],
					assignName: args[2],
					toString: Builder.Comment.prototype.toString
				})
			}
		})

		cp.commands.push({
			name:	name,
			exec:	function(args){
				args = args ? args.split(/\s+/g) : []
				this.assignName = args[0]

				if (!this.assignName) this.onfinish(function () {
					this.assignName = this.name
				})

				this[name] = true
				builder.variables[name + 's'].push(this)
			}
		}, {
			name:	'sub' + name,
			exec:	function (args) {
				args = args ? args.split(/\s+/g) : []
				this.subOf = args[0]
				this.assignName = args[1]

				if (!this.name && !this.assignName) this.onfinish(function () {
					this.assignName = args[0] + this.name
				})

				this[name] = true
				this['sub' + name] = true
				builder.variables['sub' + name + 's'].push(this)
			}
		})
	}

	group('generator', 'effect', 'control', 'processor')

	cp.commands.push({
		name: 'param',
		exec: function (args) {
			if (!args) return

			var s, x
			var p = {}
			var params = this.params = this.params || []

			while (s = /^([^\s]+)\s*/.exec(args)) {
				args	= args.substr(s[0].length)
				s	= s[1]

				x	= /^\{(.+)\}$/.exec(s)

				if (x) {
					p.type = x[1]
					continue
				}

				x	= /^(.+):(.*)$/.exec(s)

				if (x) {
					p[x[1]] = x[2] || true
					continue
				}

				p.name		= s
				p.description	= args
				args		= ''
				break
			}

			params.push(p)
		}
	}, {
		name: 'arg',
		exec: function (args) {
			if (!args) return

			var s, x
			var p = {}
			var arglist = this.arglist = this.arglist || []

			while (s = /^([^\s]+)\s*/.exec(args)) {
				args	= args.substr(s[0].length)
				s	= s[1]
				x	= /^\{(.+)\}$/.exec(s)

				if (x) {
					p.type = x[1]
					continue
				}

				x	= /^(.+):(.*)$/.exec(s)

				if (x) {
					p[x[1]] = x[2] || true
					continue
				}

				while (/^[^\w]/.exec(s)) {
					switch(s[0]) {
					case '!':
						p.optional = true
						break
					case '=':
						p.assignsToClass = true
						break
					}

					s = s.substr(1)
				}

				p.name		= s
				p.description	= args
				args		= ''

				break
			}

			arglist.push(p)
		}
	}, {
		name: 'return',
		exec: function (args) {
			if (!args) return

			var s, x, desc
			var p = {}

			while (s = /^([^\s]+)\s*/.exec(args)) {
				desc	= args
				args	= args.substr(s[0].length)
				s	= s[1]

				x	= /^\{(.+)\}$/.exec(s)
				if (x) {
					p.type = x[1]
					continue
				}

				p.description	= desc
				args		= ''
				break
			}

			this.returns = p
		}
	}, {
		name: 'method',
		exec: function (args) {
			args = args ? args.split(/\s+/g) : []
			this.method = true

			if (args[0]) {
				this.methodOf = args[0]
			}
		}
	}, {
		name: 'static',
		exec: function (args) {
			args = args ? args.split(/\s+/g) : []
			this['static'] = true
			this.method = true

			if (args[0]) {
				this.methodOf = args[0]
			}
		}
	}, {
		name: 'class',
		exec: function (args) {
			this['class'] = true
		}
	})

	builder.group = group

	builder.addPostProcessor(cp)
	builder.commentParser = cp

	return builder
}

void function () {

var a = Array.prototype

a.copy = function () {
	return this.slice()
}

a.smap = function (s, r) {
	return this.map(function(t){
		var x = r ? r.exec(t) : [t]

		return s.replace(/\$([0-9]+)/g, function (q,n) {
			return x[n]
		})
	})
}

a.table = function (tabwidth) {
	var w = []

	tabwidth = isNaN(+tabwidth) ? 8 : +tabwidth

	this.forEach(function (r) {
		r.forEach(function (c, i) {
			w[i] = Math.max(
				Math.ceil(c.length / tabwidth),
				w[i] || 0
			)
		})
	})

	return this.map(function (r) {
		var	i, s, l

		l = r.length - 1
		s = ''

		for (i=0; i<l; i++) {
			s += r[i] + Array(
				1 + w[i] - Math.floor(
					r[i].length / tabwidth
				)).join('\t')
		}

		return s + r[i]
	}).join('\n')
}

}()

module.exports = builderContext
