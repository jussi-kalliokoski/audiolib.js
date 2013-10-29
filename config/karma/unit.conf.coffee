_ = require("lodash")

module.exports = (config) ->
  buildConfig = require("../build.json")

  karmaConfig = _.extend _.cloneDeep(buildConfig.karmaDefaults),
    files: _.flatten [
      buildConfig.karmaDefaults.files
      buildConfig.javascripts
      "#{buildConfig.tempDir}/tests/unit.js"
    ]

  karmaConfig.reporters.push("coverage")

  karmaConfig.preprocessors = {}
  for file in buildConfig.javascripts
    karmaConfig.preprocessors[file] = "coverage"

  config.set(karmaConfig)
