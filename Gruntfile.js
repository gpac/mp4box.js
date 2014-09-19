module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
		all: {
		  options: {
		    urls: [
		      'http://localhost:9000/test/qunit.html'
		    ]
		  }
		}
    },
    connect: {
	    server: {
	      options: {
	        port: 9000,
	        base: '.'
	      }
	    }
  	},
  	jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js', '!test/lib/**/*.js'],
      options: {
        // options here to override JSHint defaults
    	eqeqeq: false,
    	asi: true,
    	loopfunc: true,
    	eqnull: true,
        globals: {
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'connect', 'qunit']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('test', ['jshint', 'connect', 'qunit']);

  grunt.registerTask('default', [ 'jshint', 'concat', 'uglify']);

};