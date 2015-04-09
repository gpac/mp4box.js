module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      all: {
        src: ['src/log.js',         // logging system
              'src/DataStream.js',  // bit/byte/string read-write operations
              'src/descriptor.js',  // MPEG-4 descriptor parsing
              'src/box.js',         // base code for box parsing/writing
              'src/box-parse.js',   // box parsing code 
              'src/box-write.js',   // box writing code
              'src/box-unpack.js',  // box code for sample manipulation
              'src/mp4-text.js',  // text-based track manipulations
              'src/isofile.js',     // file level operations (read, write)
              'src/mp4box.js'       // application level operations (data append, sample extraction, segmentation, ...)
        ],
        dest: 'dist/<%= pkg.name %>.all.js'
      },
      simple: {
        src: ['src/log.js',         // logging system
              'src/DataStream.js',  // bit/byte/string read-write operations
              'src/box.js',         // base code for box parsing/writing
              'src/box-parse.js',   // box parsing code 
              'src/isofile.js',     // file level operations (read, write)
              'src/mp4box.js'       // application level operations (data append, sample extraction, segmentation, ...)
        ],
        dest: 'dist/<%= pkg.name %>.simple.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      all: {
        files: {
          'dist/<%= pkg.name %>.all.min.js': ['<%= concat.all.dest %>']
        }
      },
      simple: {
        files: {
          'dist/<%= pkg.name %>.simple.min.js': ['<%= concat.simple.dest %>']
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
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js', '!test/lib/**/*.js' , '!test/mp4/**/*.js'],
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

  grunt.registerTask('all', [ 'concat:all', 'uglify:all']);
  grunt.registerTask('simple', [ 'concat:simple', 'uglify:simple']);

  grunt.registerTask('default', [ 'jshint', 'all', 'simple']);

};