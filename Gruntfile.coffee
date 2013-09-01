module.exports = (grunt) ->
  config =
    package: require('./package.json')
    javascripts: [
      "src/api-*.js"
      "src/*/*.js"
    ]

    OUT_FILE: "lib/audiolib.js"
    OUT_FILE_MIN: "lib/audiolib.min.js"

    RELEASE_TGZ: "lib/audiolib.js.<%= package.version %>.tar.gz"
    RELEASE_ZIP: "lib/audiolib.js.<%= package.version %>.zip"
    
    clean:
      lib:
        src: ["lib"]
    concat:
      default:
        options:
          banner: grunt.file.read("src/wrapper-start.js")
          footer: grunt.file.read("src/wrapper-end.js")
        src: ["<%= javascripts %>"]
        dest: "<%= OUT_FILE %>"
    uglify:
      default:
        src: ["<%= OUT_FILE %>"]
        dest: "<%= OUT_FILE_MIN %>"
    compress:
      tgz:
        options:
          mode: "tgz"
          archive: "<%= RELEASE_TGZ %>"
        files: [{
          src: "*.js"
          dest: ""
          cwd: "lib"
        }]
      zip:
        options:
          mode: "zip"
          archive: "<%= RELEASE_ZIP %>"
        files: [{
          src: "*.js"
          dest: ""
          cwd: "lib"
        }]

  grunt.initConfig(config)

  grunt.loadNpmTasks("grunt-contrib-clean")
  grunt.loadNpmTasks("grunt-contrib-compress")
  grunt.loadNpmTasks("grunt-contrib-concat")
  grunt.loadNpmTasks("grunt-contrib-uglify")

  buildTools = require('./dependencies/build-scripts')

  grunt.registerTask "docs", "Updates the documentation", ->
    buildTools.updatables.docs()

  grunt.registerTask "wrappers", "Updates the wrappers.", ->
    buildTools.updatables.wrappers()

  grunt.registerTask "package", "Updates the package.", ->
    buildTools.updatables.package()
