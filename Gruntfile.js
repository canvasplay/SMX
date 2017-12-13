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

        },

        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [

                    'dist/document/Sizzle.js',

                    'dist/smx.js',

                    'dist/compiler/Compiler.js',

                    'dist/time/time.js',
                    'dist/time/Timer.js',
                    'dist/time/Timeline.js',
                    'dist/playhead/SMXPlayhead.js',



                    'dist/finder/SMXFinder.js',


                    'dist/document/fn.js',
                    'dist/document/TimeAttrController.js',
                    'dist/document/UIAttrController.js',


                    //PLUGINS

                    //Tracking
                    'dist/tracking/TrackManager.js',
                    'dist/tracking/attributes/progress.js',
                    'dist/tracking/attributes/score.js',
                    'dist/tracking/attributes/status.js',
                    'dist/tracking/attributes/access.js',
                    'dist/tracking/attributes/points.js',
                    'dist/tracking/TrackInterface.js',
                    

                    //Prototype
                    'dist/plugins/prototype/CSSParser.js',
                    'dist/plugins/prototype/PrototypeParser.js',
                    
                    //Metadata
                    'dist/plugins/metadata/MetadataParser.js',
                    'dist/plugins/metadata/MetadataInterface.js',

                    //Taxonomy
                    //'dist/taxonomy/TaxonomyParser.js',
                    'dist/plugins/taxonomy/TaxonomyInterface.js',


                    'dist/document/Node.js'


                ],
                dest: 'dist/smx.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy HH:MM:ss") %> */\n'
            },
            dist: {
                files: {
                    'dist/smx.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },

        //clean all subfolders in dist/
        clean: ['dist/*/']


    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('version', ['bump']);
    //grunt.registerTask('default', ['babel', 'concat', 'uglify','clean']);
    grunt.registerTask('default', ['babel', 'concat', 'uglify', 'clean']);

};
