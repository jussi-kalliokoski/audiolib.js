/*jshint asi:true */
module.exports = function (grunt) {

var buildTools

try {
	buildTools = require('./dependencies/build-scripts')
} catch (e) {
	console.error('WARNING:', 'It seems that you are missing packages script-builder and/or paramon.')
	console.error('WARNING:', 'This is only a problem if you use following tasks: all update docs package wrappers.')
}

function insert (arr, pos, arr2) {
	return arr.splice.apply(arr, [pos, 0].concat(arr2))
}

var config = {
	SOURCE : ['src/api-*.js', 'src/*/*.js'],
	TEMPLATES : [/* SOURCE, */ 'templates/', 'build'],
	WRAPPERS : ['src/wrapper-start.js', 'src/wrapper-end.js'],

	IN: [/* WRAPPERS <- SOURCE*/],
	OUT : 'lib/audiolib.js',
	DOCS : 'lib/docs.html',
	OUT_MIN : 'lib/audiolib.min.js',
	RELEASE_TAR_GZ : 'audiolib.js.tar.gz',
	RELEASE_ZIP : 'audiolib.js.zip',
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

grunt.initConfig(config)
grunt.registerTask('default', 'lint:main concat:main')
grunt.registerTask('all', 'lint:main concat:main min:main docs')

grunt.registerTask('docs', 'Updates the documentation.', function () {
	buildTools.updatables.docs()
})

grunt.registerTask('wrappers', 'Updates the wrappers.', function () {
	buildTools.updatables.wrappers()
})

grunt.registerTask('package', 'Updates the package.json.', function () {
	buildTools.updatables['package']()
})

grunt.registerTask('update', 'Updates docs, wrappers and the package.', 'docs wrappers package')

}
