module.exports = (grunt) ->
  _ = grunt.util._

  gruntConfig = _.extend {},
    package: require("./package.json")
    jshintrc: ".jshintrc",
    gruntfile: "Gruntfile.coffee",
    tempDir: "dist/temp",
    javascripts: [
      "src/index.js",
      "src/core/node.js",
      "src/tools/index.js",
      "src/tools/calculate-offset.js",
      "src/tools/offset.js",
      "src/tools/window-functions.js",
      "src/nodes/index.js",
      "src/nodes/band-limited-oscillator.js",
      "src/nodes/noise-source.js",
      "src/nodes/oscillation-source.js",
      "src/nodes/simple-oscillator.js",
      "src/nodes/phasor.js"
    ],

    clean:
      coverage:
        src: ["dist/coverage"]
      temporary:
        src: ["<%= tempDir %>"]
      all:
        src: ["dist"]
    concat:
      lib:
        dest: "dist/<%= package.name %>.js"
        src: [
          "dist/webarraymath.js",
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
    plato:
      all:
        options:
          jshint:
            options:
              jshintrc: '.jshintrc'
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

  grunt.initConfig(gruntConfig)

  # load all grunt tasks based on package.json
  gruntTasks = _
    .map(gruntConfig.package.devDependencies, (version, name) -> name)
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
    "jshint"
    "coverage"
  ])
