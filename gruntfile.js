module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    closurecompiler: {
      library: {
        files: {
          "Build/Cloudia.min.js": ["node_modules/nanoajax/nanoajax.min.js", "src/Cloudia.js"]
        },
        options: {
          "compilation_level": "ADVANCED_OPTIMIZATIONS",
          "externs": ["externs/nanoajax.js"]
        }
      }
    },
    jsdoc2md: {
      library: {
        src: 'src/Cloudia.js',
        dest: 'Build/API.md'
      }
    },
    less: {
      library: {
        options: {
          plugins: [
            new (require('less-plugin-autoprefix'))({browsers: ["last 2 versions"]}),
            new (require('less-plugin-clean-css'))({advanced: true})
          ]
        },
        files: {
          'Build/Cloudia.min.css': 'src/Cloudia.less'
        }
      }
    },
    concat: {
      readme: {
        src: ['Docs/*.md', 'Build/API.md'],
        dest: 'Readme.md',
        options: {
          'heading-depth': 3
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-closurecompiler-new-grunt');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-jsdoc-to-markdown');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['closurecompiler:library', 'less:library', 'jsdoc2md:library', 'concat:readme']);

};