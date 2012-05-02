/*jshint asi:true */
module.exports = function (grunt) {


var path = require('path')
var fs = require('fs')
var log = grunt.log

var buildTools

try {
	buildTools = require('./dependencies/build-scripts')
} catch (e) {
	log.error('WARNING: It seems that you are missing packages script-builder and/or paramon.')
	log.error('WARNING: This is only a problem if you use following tasks: all update docs package wrappers.')
}

function insert (arr, pos, arr2) {
	return arr.splice.apply(arr, [pos, 0].concat(arr2))
}

var config = {
	pkg : '<json:package.json>',

	SOURCE : ['src/api-*.js', 'src/*/*.js'],
	TEMPLATES : [/* SOURCE, */ 'templates/', 'build'],
	WRAPPERS : ['src/wrapper-start.js', 'src/wrapper-end.js'],

	IN: [/* WRAPPERS <- SOURCE*/],
	OUT : 'lib/audiolib.js',
	DOCS : 'lib/docs.html',
	OUT_MIN : 'lib/audiolib.min.js',

	RELEASE_TAR_GZ : 'lib/audiolib.js.<%= pkg.version %>.tar.gz',
	RELEASE_ZIP : 'lib/audiolib.js.<%= pkg.version %>.zip',
	RELEASE : [],

	PACKAGE : 'package.json',

	TOOLS : ['build', 'dependencies/build-scripts/*.js', 'Gruntfile.js'],

	concat: {
		main: {
			src: '<config:IN>',
			dest: '<config:OUT>'
		}
	},

	min: {
		main: {
			src: '<config:OUT>',
			dest: '<config:OUT_MIN>'
		}
	},

	lint: {
		main: '<config:SOURCE>',
		tools: '<config:TOOLS>'
	},

	tar: {
		main: {
			src: '<config:RELEASE>',
			dest: '<config:RELEASE_TAR_GZ>',
			cwd: 'lib'
		}
	},

	zip: {
		main: {
			src: '<config:RELEASE>',
			dest: '<config:RELEASE_ZIP>',
			cwd: 'lib'
		}
	},

	jshint: {
		options: {
			boss: true,
			evil: true,
			onecase: true
		},

		globals: {
			audioLib: true,
			Sink: true
		}
	},

	uglify: {}
}

insert(config.TEMPLATES, 0, config.SOURCE)
insert(config.IN, 0, config.WRAPPERS)
insert(config.IN, 1, config.SOURCE)
insert(config.RELEASE, 0, [config.OUT, config.OUT_MIN])

grunt.initConfig(config)

grunt.registerTask('default', 'lint:main concat:main')
grunt.registerTask('all', 'lint:main concat:main min:main docs')

grunt.task.loadTasks(
	path.join(path.dirname(require.resolve('grunt-pack')), 'tasks'))

grunt.registerTask('docs', 'Updates the documentation.', function () {
	buildTools.updatables.docs()
})

grunt.registerTask('wrappers', 'Updates the wrappers.', function () {
	buildTools.updatables.wrappers()
})

grunt.registerTask('package', 'Updates the package.json.', function () {
	buildTools.updatables['package']()
})

grunt.registerTask('clean', 'Removes generated files', function () {
	fs.readdirSync('lib').forEach(function (d) {
		fs.unlinkSync(path.join('lib', d))
	})

	fs.rmdirSync('lib')
})

grunt.registerTask('integrate', 'Update the local sink.js from the subrepo.', function () {
	grunt.utils.spawn('make', {
		args: ['sink.js'],
		opts: {
			cwd: path.join('dependencies', 'sink.js')
		}
	})

	grunt.file.copy(path.join('dependencies', 'sink.js', 'sink.js'),
		path.join('src', 'io', 'sink.js'))
})

grunt.registerTask('update', 'Updates docs, wrappers and the package.', 'docs wrappers package')
grunt.registerTask('release', 'Packages generated files for release.', 'tar:main zip:main')

}
