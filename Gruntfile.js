module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        bump: {
          options: {
            files:  ['package.json'],
            updateConfigs: ['pkg'],
            commit: false,
            createTag: false,
            push: false
          }
        },

        babel: {
            options: {
                sourceMap: true,
                presets: ['babel-preset-es2015']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.js'],
                    dest: 'build/'
                }]
            },

        },

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [

                    'build/document/Sizzle.js',

                    'build/smx.js',

                    'build/compiler/Compiler.js',

                    'build/time/time.js',
                    'build/time/Timer.js',
                    'build/time/Timeline.js',
                    'build/playhead/SMXPlayhead.js',



                    'build/finder/SMXFinder.js',


                    'build/document/fn.js',
                    'build/document/TimeAttrController.js',
                    'build/document/UIAttrController.js',


                    //PLUGINS

                    //Tracking
                    'build/tracking/TrackManager.js',
                    'build/tracking/attributes/progress.js',
                    'build/tracking/attributes/score.js',
                    'build/tracking/attributes/status.js',
                    'build/tracking/attributes/access.js',
                    'build/tracking/attributes/points.js',
                    'build/tracking/TrackInterface.js',
                    

                    //Prototype
                    'build/plugins/prototype/CSSParser.js',
                    'build/plugins/prototype/PrototypeParser.js',
                    
                    //Metadata
                    'build/plugins/metadata/MetadataParser.js',
                    'build/plugins/metadata/MetadataInterface.js',

                    //Taxonomy
                    //'build/taxonomy/TaxonomyParser.js',
                    'build/plugins/taxonomy/TaxonomyInterface.js',


                    'build/document/Document.js'


                ],
                dest: 'build/smx.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy HH:MM:ss") %> */\n'
            },
            dist: {
                files: {
                    'build/smx.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },

        //clean all subfolders in build/
        clean: ['build/*/']


    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('version', ['bump']);
    //grunt.registerTask('default', ['babel', 'concat', 'uglify','clean']);
    grunt.registerTask('default', ['babel', 'concat', 'clean']);

};
