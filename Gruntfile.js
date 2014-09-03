module.exports = function(grunt) {
    // Load the jshint plugin
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Project configuration.
    grunt.initConfig({
        jshint: {
            options: {
                eqeqeq: true
            },
            all: ["src/**/*.js"]
        }
    });
};