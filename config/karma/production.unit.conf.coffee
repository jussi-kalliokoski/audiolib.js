_ = require("lodash")

module.exports = (config) ->
  buildConfig = require("../build.json")

  karmaConfig = _.extend _.cloneDeep(buildConfig.karmaDefaults),
    files: _.flatten [
      buildConfig.karmaDefaults.files
      "dist/#{buildConfig.package.name}-#{buildConfig.package.version}.min.js"
      "#{buildConfig.tempDir}/tests/unit.js"
    ]

  config.set(karmaConfig)
