module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      options: {
        browserifyOptions: {
          standalone: 'MP4Box'
        }
      },
      all: {
        src: ['src/index.js'],
        dest: 'dist/<%= pkg.name %>.all.js'
      },
      simple: {
        src: ['src/simple.js'],
        dest: 'dist/<%= pkg.name %>.simple.js'
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
        sourceMap: true
      },
      all: {
        files: {
          'dist/<%= pkg.name %>.all.min.js': ['<%= browserify.all.dest %>']
        }
      },
      simple: {
        files: {
          'dist/<%= pkg.name %>.simple.min.js': ['<%= browserify.simple.dest %>']
        }
      },
    },
  	jshint: {
      files: [
        'Gruntfile.js', 
        'src/**/*.js', 
        'test/**/*.js', 
        // Exclude the following from lint 
        '!test/lib*/**/*.js', 
        '!test/mp4/**/*.js',
        '!test/trackviewers/**/*.js', 
        '!test/coverage/**/*.js', 
      ],
      options: {
        // options here to override JSHint defaults
        eqeqeq: false,
        asi: true,
        //verbose: true,
	loopfunc: true,
        eqnull: true,
	reporterOutput: "",
        globals: {
        }
      }
    },
    eslint: {
      target: ['src/**/*.js'],
      options: {
        configFile: '.eslintrc.js'
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['default']
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },
    bump: {
      options: {
        files:  ['package.json'],
        pushTo: 'origin'
      }
    },
    coveralls: {
        options: {
            coverageDir: 'test/coverage/',
            force: true
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-karma-coveralls');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('all', [ 'browserify:all', 'uglify:all']);
  grunt.registerTask('simple', [ 'browserify:simple', 'uglify:simple']);
  grunt.registerTask('default', [ 'jshint', 'eslint', 'all', 'simple']);
  grunt.registerTask('test', ['default', 'karma', 'coveralls']);

};
