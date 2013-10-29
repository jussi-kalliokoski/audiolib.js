module.exports = (grunt) ->
  _ = grunt.util._

  config = require("./config/build.json")
  config.package = require("./package.json")

  gruntConfig = _.extend {}, config,
    clean:
      coverage:
        src: ["dist/coverage"]
      temporary:
        src: ["<%= tempDir %>"]
      all:
        src: ["dist"]
    coffee:
      unit:
        files: [{
          src: "tests/unit/**/*.coffee"
          dest: "<%= tempDir %>/tests/unit.js"
        }]
    concat:
      lib:
        dest: "dist/<%= package.name %>.js"
        src: [
          "<%= javascripts %>"
        ]
    coverage:
      options:
        thresholds:
          statements: 100
          branches: 100
          lines: 100
          functions: 100
        dir: "dist/coverage"
    jshint:
      default:
        src: ["<%= javascripts %>"]
        options:
          jshintrc: "<%= jshintrc %>"
    karma:
      unitDev:
        configFile: "config/karma/unit.conf.coffee"
      unitProduction:
        configFile: "config/karma/production.unit.conf.coffee"
    plato:
      all:
        options:
          jshint:
            options:
              jshintrc: config.jshintrc
          complexity:
            logicalor: false
            switchcase: false
            forin: true
            trycatch: true
        files:
          "dist/report": ["<%= javascripts %>"]
    uglify:
      options:
        report: "min"
      lib:
        files: [{
          dest: "dist/<%= package.name %>-<%= package.version %>.min.js"
          src: [
            "<%= javascripts %>"
          ]
        }]

  # Dump config for debugging
  grunt.log.verbose.writeln("Config dump: " + JSON.stringify(config, null, "  "))

  grunt.initConfig(gruntConfig)

  # load all grunt tasks based on package.json
  gruntTasks = _
    .map(config.package.devDependencies, (version, name) -> name)
    .filter( (name) -> /^grunt-(?!cli)/.test(name) )
    .forEach( (task) -> grunt.loadNpmTasks(task) )

  grunt.registerTask("compile:js", [
    "concat:lib"
  ])

  grunt.registerTask("minify:js", [
    "uglify:lib"
  ])

  grunt.registerTask("build:dev", [
    "compile:js"
  ])

  grunt.registerTask("build:production", [
    "minify:js"
  ])

  grunt.registerTask("prepublish", [
    "build:dev"
    "build:production"
  ])

  grunt.registerTask("test", [
    "build:production"
    "clean:coverage"
    "coffee:unit"
    "karma"
    "jshint"
    "coverage"
  ])
