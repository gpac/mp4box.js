// Karma configuration
// Generated on Tue Jun 02 2015 11:17:18 GMT+0200 (Paris, Madrid (heure d’été))

module.exports = function(config) {
    var configuration = {
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: './test',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['qunit'],


        // client configuration
        client: {
          qunit: {
            testTimeout: 5000
          }
        },


        // list of files / patterns to load in the browser
        files: [
          '../dist/mp4box.all.js',
          'qunit-helper.js',
          'qunit-media-data.js',
          'qunit-box-data.js',
          'qunit-tests.js',
          'qunit-isofile-tests.js',
          'qunit-mse-tests.js',
          'iso-conformance-files.js',
          'qunit-iso-conformance.js',
          'qunit-iso-creation.js',
        ],


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            '../src/**/!(scnm|prol|rash|dtrt|avll|scif|mvif|stsa|sync|avss|tsas|tscl|vipr|mett|sbtt).js': ['coverage']
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        // 
        //browsers: ['Chrome', 'Firefox'],
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        //browserDisconnectTimeout : 10000, // default 2000
        //browserDisconnectTolerance : 1, // default 0
        //browserNoActivityTimeout : 60000, //default 10000
        browserNoActivityTimeout: 30000,
        
        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },

        coverageReporter: {
          reporters: [ 
            { type: "lcov", dir: "coverage/" },
            { type: 'text-summary' }
          ]
        },
    };
    if (process.env.TRAVIS) {
        configuration.browsers = ['Chrome_travis_ci'];
    }
    config.set(configuration);
};
