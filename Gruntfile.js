module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '',
        process: function(src, filepath) {
          return '// file:' + filepath + '\n' + src;
        }
      },
      all: {
        src: ['src/log.js',                       // logging system
              'src/stream.js',                    // simple stream parser
              'src/DataStream.js',                // bit/byte/string read operations
              'src/DataStream-write.js',          // bit/byte/string write operations
              'src/DataStream-map.js',            // bit/byte/string other operations
              'src/buffer.js',                    // multi-buffer datastream
              'src/descriptor.js',                // MPEG-4 descriptor parsing
              'src/box.js',                       // core code for box definitions
              'src/box-parse.js',                 // basic box parsing code
              'src/parsing/sampleentries/sampleentry.js',              // box-specific parsing code
              'src/parsing/**/*.js',              // box-specific parsing code
              'src/box-codecs.js',                // core code for box definitions
              'src/box-write.js',                 // box writing code
              'src/writing/**/*.js',              // box-specific writing code
              'src/box-unpack.js',                // box code for sample manipulation
              'src/box-diff.js',                  // box code for diff processing
              'src/text-mp4.js',                  // text-based track manipulations
              'src/isofile.js',                   // basic file level operations (parse, get boxes)
              'src/isofile-advanced-parsing.js',  // file level advanced parsing operations (incomplete boxes, mutliple buffers ...)
              'src/isofile-advanced-creation.js',    // file level advanced operations to create files from scratch
              'src/isofile-sample-processing.js', // file level sample processing operations (sample table, get, ...)
              'src/isofile-item-processing.js',   // item processing operations (sample table, get, ...)
              'src/isofile-write.js',             // file level write operations (segment creation ...)
              'src/box-print.js',                 // simple print
              'src/mp4box.js'                     // application level operations (data append, sample extraction, segmentation, ...)
        ],
        dest: 'dist/<%= pkg.name %>.all.js'
      },
      simple: {
        src: ['src/log-simple.js',
              'src/stream.js',
              'src/box.js',
              'src/box-parse.js',
              'src/parsing/emsg.js',
              'src/parsing/styp.js',
              'src/parsing/ftyp.js',
              'src/parsing/mdhd.js',
              'src/parsing/mfhd.js',
              'src/parsing/mvhd.js',
              'src/parsing/sidx.js',
              'src/parsing/ssix.js',
              'src/parsing/tkhd.js',
              'src/parsing/tfhd.js',
              'src/parsing/tfdt.js',
              'src/parsing/trun.js',
              'src/isofile.js',
              'src/box-print.js',                 
              'src/mp4box.js'
        ],
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
          'dist/<%= pkg.name %>.all.min.js': ['<%= concat.all.dest %>']
        }
      },
      simple: {
        files: {
          'dist/<%= pkg.name %>.simple.min.js': ['<%= concat.simple.dest %>']
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
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-karma-coveralls');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('all', [ 'concat:all', 'uglify:all']);
  grunt.registerTask('simple', [ 'concat:simple', 'uglify:simple']);
  grunt.registerTask('default', [ 'jshint', 'all', 'simple']);
  grunt.registerTask('test', ['default']);

};
