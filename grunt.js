/*jshint asi:true */
module.exports = function (grunt) {

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

	concat: {
		dist: {
			src: '<config:IN>',
			dest: '<config:OUT>'
		}
	},

	lint: {
		files: '<config:SOURCE>'
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
	}
}

insert(config.TEMPLATES, 0, config.SOURCE)
insert(config.IN, 0, config.WRAPPERS)
insert(config.IN, 1, config.SOURCE)

grunt.initConfig(config)
grunt.registerTask('default', 'lint concat')

}
