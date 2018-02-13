module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        bump: {
          options: {
            files:  ['package.json'],
            updateConfigs: ['pkg'],
            commit: true,
            createTag: false,
            push: false
          }
        },

        babel: {
          options: {
            sourceMap: true,
            presets: ['babel-preset-env']
          },
          dist: {
            files: [{
              expand: true,
              cwd: 'src/',
              src: ['**/*.js'],
              dest: 'dist/'
            }]
          },
          test: {
            files: [{
              expand: true,
              cwd: 'test/',
              src: ['test.js'],
              dest: 'out/'
            }]
          }
        },

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [

                    './node_modules/sizzle/dist/sizzle.js',

                    'dist/smx.js',
                    'dist/smx.load.js',

                    
                    'dist/loader/Loader.js',
                    'dist/loader/IdAttributeParser.js',

                    'dist/playhead/Playhead.js',
                    
                    //Core
                    'dist/document/Node.Core.js',
                    'dist/document/Node.AttributeGetters.js',
                    'dist/document/Node.TreeNode.js',
                    
                    'dist/document/Node.js',
                    'dist/document/Document.js'
                    
                    //without plugins...

                ],
                dest: 'dist/smx.js'
            }
        },

        uglify: {
            options: {
                banner: "/** <%= pkg.name %> <%= grunt.file.readJSON('package.json').version %> */\n"
            },
            dist: {
                files: {
                    'dist/smx.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },

        //clean all subfolders in dist/
        clean: {
          all: ['dist/**/*', '!dist/smx.js','!dist/smx.min.js','!dist/smx.js.map']
        }


    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('version', ['bump']);
    //grunt.registerTask('default', ['babel', 'concat', 'uglify','clean']);
    grunt.registerTask('default', ['babel', 'concat', 'uglify', 'clean']);
    grunt.registerTask('test', ['babel:test']);

};
