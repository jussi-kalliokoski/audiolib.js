module.exports = (grunt) ->
  _ = grunt.util._

  gruntConfig = _.extend {},
    package: require("./package.json")
    jshintrc: ".jshintrc",
    gruntfile: "Gruntfile.coffee",
    tempDir: "dist/temp",
    javascripts: [
      "src/Node.js",
      "src/WindowFunctions.js",
      "src/Tools/index.js",
      "src/Tools/offset.js",
      "src/Nodes/Phasor.js"
    ],
    # Dependencies that will not be bundled with the browser build.
    # [<library name in Node.js>, <library name in the browser>]
    browserDependencies: [
      ["dsp", "webarraymath"],
      ["underscore", "_"]
    ]

    clean:
      coverage:
        src: ["dist/coverage"]
      temporary:
        src: ["<%= tempDir %>"]
      failurePlots:
        src: ["tests/failure-plots/*.html"] 
      all:
        src: ["dist"]
    browserify:
      lib:
        files:
          'dist/<%= package.name %>.js': ['./index.js']
        options:
          alias: "<%= browserDependencies.map(function(dep) { return tempDir + '/' + dep[0] + '.js:' + dep[0] }) %>"
    simplemocha:
      options:
        globals: ['expect'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec',
        compilers: 'coffee:coffee-script'
      all: { src: 'tests/src/**/*.coffee' }
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

  grunt.registerTask 'browser-dependencies-export', 'create the files that will expose browser dependencies to our browserified code', () ->
    async = require('async')
    fs = require('fs')

    done = this.async()
    deps = grunt.config('browserDependencies')
    tempDir = grunt.config('tempDir')

    exposeDepsFiles = deps.map (dep) ->
      (next) ->
        browserModuleName = dep[1]
        nodeModuleName = dep[0]
        fs.writeFile(
          tempDir + '/' + nodeModuleName + '.js'
          'module.exports = window.' + browserModuleName
          next
        )
    async.series exposeDepsFiles, done
    
  grunt.registerTask("compile:js", [
    "browser-dependencies-export",
    "browserify:lib"
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
    "simplemocha:all"
    "clean:coverage"
    "clean:failurePlots"
    "jshint"
    "coverage"
  ])
