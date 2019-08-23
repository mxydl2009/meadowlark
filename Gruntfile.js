module.exports = function (grunt) {
    // 加载插件
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-contrib-less',
        'grunt-contrib-uglify',
        'grunt-contrib-cssmin',
        'grunt-hashres'
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    // 配置插件
    grunt.initConfig({
        cafemocha: {
            all: {
                src: ['qa/tests-unit.js', 'qa/tests-stress.js', 'qa/tests-api.js'],
                options: { 
                    ui: 'tdd',
                    timeout: 2000
                }
            }
        },
        jshint: {
            app: [
                'meadowlark.js', 
                'public/js/**/*.js',
                'lib/**/*.js'
            ],
            qa: [
                'Gruntfile.js', 
                'public/qa/**/*.js',
                'qa/**/*.js'
            ]
        },
        less: {
            development: {
                options: {
                    customFunctions: {
                        static: function (lessObject, name) {
                            return `url("${require('./lib/static.js').map(name.value)}")`;
                        }
                    }
                },
                files: {
                    'public/css/main.css': 'less/main.less',
                    'public/css/cart.css': 'less/cart.less'
                }
            }
        },
        uglify: {
            all: {
                files: {
                    'public/js/meadowlark.min.js': ['public/js/**/*.js']
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'public/css/meadowlark.css': ['public/css/**/*.cs', '!public/css/meadowlark*.css']
                }
            },
            minify: {
                src: 'public/css/meadowlark.css',
                dest: 'public/css/meadowlark.min.css'
            }
        },
        hashres: {
            options: {
                fileNameFormat: '${name}.${hash}.${ext}'
            },
            all: {
                src: [
                    'public/js/meadowlark.min.js',
                    'public/css/meadowlark.min.css'
                ],
                dest: [
                    'config.js'
                ]
            }
        }
        // exec: {
            
        // }
    });

    // 注册任务
    grunt.registerTask('default', ['cafemocha', 'jshint']);
    grunt.registerTask('static', ['less', 'cssmin', 'uglify', 'hashres']);
}