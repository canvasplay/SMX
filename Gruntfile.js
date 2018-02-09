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
                    'dist/smx.load.js',

                    
                    'dist/compiler/Compiler.js',
                    'dist/compiler/IdAttributeParser.js',

                    'dist/playhead/Playhead.js',
                    

                    'dist/finder/SMXFinder.js',


                    //PLUGINS

                    //Prototype
                    'dist/plugins/prototype/CSSParser.js',
                    'dist/plugins/prototype/PrototypeParser.js',
                    
                    //Metadata
                    'dist/plugins/metadata/MetadataParser.js',
                    'dist/plugins/metadata/MetadataInterface.js',
                    'dist/plugins/metadata/Sizzle.selectors.filters.meta.js',

                    //Taxonomy
                    //'dist/taxonomy/TaxonomyParser.js',
                    'dist/plugins/taxonomy/TaxonomyInterface.js',


                    //Core
                    'dist/document/fn.js',
                    'dist/document/Node.Core.js',
                    'dist/document/Node.AttributeGetters.js',
                    'dist/document/Node.TreeNode.js',
                    
                    'dist/document/smx.UIAttrController.js',

                    'dist/document/Node.js',
                    'dist/document/Document.js'



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

};
