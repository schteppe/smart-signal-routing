module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify : {
            test : {
                src : ["src/browserify.js"],
                dest : 'build/ssr.js',
                options: {
                    standalone : "SSR"
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.registerTask('default', ['browserify']);

};
