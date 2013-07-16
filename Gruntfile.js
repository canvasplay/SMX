module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        separator: ';'
      },
      dist: {
        // the files to concatenate
        src: [
          '<%= pkg.branch %>/smx.js',

          '<%= pkg.branch %>/compiler/Compiler.js',

          '<%= pkg.branch %>/time/time.js',
          '<%= pkg.branch %>/time/Timer.js',
          '<%= pkg.branch %>/time/Timeline.js',
          '<%= pkg.branch %>/playhead/Playhead.js',

          '<%= pkg.branch %>/tracking/tracking.js',
          '<%= pkg.branch %>/tracking/attributes/attributes.js',
          '<%= pkg.branch %>/tracking/attributes/progress.js',
          '<%= pkg.branch %>/tracking/attributes/score.js',
          '<%= pkg.branch %>/tracking/TriggerExpression.js',
          '<%= pkg.branch %>/tracking/Track.js',
          '<%= pkg.branch %>/tracking/TrackManager.js',

          '<%= pkg.branch %>/meta/meta.js',
          '<%= pkg.branch %>/meta/MetaData.js',
          '<%= pkg.branch %>/meta/MetaManager.js',

          '<%= pkg.branch %>/document/Sizzle.js',
          '<%= pkg.branch %>/document/CSSParser.js',
          '<%= pkg.branch %>/document/TimeAttrController.js',
          '<%= pkg.branch %>/document/UIAttrController.js',
          '<%= pkg.branch %>/document/Document.js'


        ],
        // the location of the resulting JS file
        dest: 'build/smx.js'
      }
    },
    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner: '/*! <%= pkg.name %> <%= pkg.branch %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'build/smx.min.js': ['<%= concat.dist.dest %>']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['concat','uglify']);
  //grunt.registerTask('default', ['concat']);

};