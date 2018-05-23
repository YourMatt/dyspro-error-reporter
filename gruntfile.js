module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        sass: {
            site: {
                options: {
                    sourcemap: "inline",
                    style: "nested"
                },
                files: {
                    "public/site.css": "frontend-src/scss/site.scss"
                }
            }
        },
        cssmin: {
            options: {
                sourceMap: false
            },
            minify_site_css: {
                files: [{
                    expand: true,
                    cwd: "public",
                    src: [
                        "*.css",
                        "!*.min.css"
                    ],
                    dest: "public",
                    ext: ".min.css"
                }]
            }
        },
        uglify: {
            uglify_site_js: {
                options: {
                    compress: true,
                    mangle: true,
                    sourceMap: true
                },
                files: {
                    "public/site.min.js": [
                        // custom init
                        "frontend-src/js/init.js",
                        // page-specific
                        "frontend-src/js/dashboard.js",
                        "frontend-src/js/errors.js",
                        "frontend-src/js/error-detail.js",
                        "frontend-src/js/settings.js",
                        // general
                        "frontend-src/js/notifications.js"
                    ]
                }
            },
            uglify_framework_js: {
                options: {
                    compress: true,
                    mangle: true,
                    sourceMap: true
                },
                files: {
                    "public/framework.min.js": [
                        // installed modules
                        "node_modules/jquery/dist/jquery.js",
                        "node_modules/popper.js/dist/umd/popper.js",
                        "node_modules/bootstrap/dist/js/bootstrap.js",
                        "node_modules/angular/angular.js",
                        "node_modules/moment/moment.js",
                        "node_modules/toastr/toastr.js",
                        // third-party scripts not available through npm
                        "frontend-src/js/plugins/jquery.mask.js"
                    ]
                }
            }
        },
        watch: {
            options: {
                livereload: true
            },
            watch_scss_files: {
                files: [
                    "frontend-src/scss/*.scss",
                    "frontend-src/scss/*/*.scss"
                ],
                tasks: [
                    "sass:site",
                    "cssmin:minify_site_css"
                ]
            },
            watch_js_files: {
                files: [
                    "frontend-src/js/*.js"
                ],
                tasks: [
                    "uglify:uglify_site_js"
                ]
            },
            watch_js_files_framework: {
                files: [
                    "frontend-src/js/plugins/*.js"
                ],
                tasks: [
                    "uglify:uglify_framework_js"
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-sass");
    grunt.loadNpmTasks("grunt-postcss");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("clean-dist", [
        "cssmin:minify_site_css"
    ]);
    grunt.registerTask("build", [
        "sass",
        "cssmin",
        "uglify"
    ]);
    grunt.registerTask("default", [
        "watch"
    ]);

};