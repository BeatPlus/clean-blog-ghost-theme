const {series, watch, src, dest, parallel} = require('gulp');
const pump = require('pump');

// gulp plugins and utils
var livereload = require('gulp-livereload');
var less = require('gulp-less');

var zip = require('gulp-zip');
var uglify = require('gulp-uglify');
var beeper = require('beeper');


var LessAutoprefix = require('less-plugin-autoprefix');
var LessPluginCleanCSS = require('less-plugin-clean-css');

// postcss plugins
var autoprefix = new LessAutoprefix({ browsers: ['last 2 versions'] });
var cleanCSSPlugin = new LessPluginCleanCSS({advanced: true});

function serve(done) {
    livereload.listen();
    done();
}

const handleError = (done) => {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

function hbs(done) {
    pump([
        src(['*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function comp_less(done) {
    var processors = [
        autoprefix,
        cleanCSSPlugin
    ];

    pump([
        src('assets/less/main.less', {sourcemaps: true}),
        less({
            plugins: processors
        }),
        dest('assets/built/', {sourcemaps: true}),
        livereload()
    ], handleError(done));
}

function js(done) {
    pump([
        src('assets/js/**/!(*.min).js', {sourcemaps: true}),
        uglify(),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function CopyMinAssets(done) {
    pump([
        src('assets/*/*.min.*'),
        dest('assets/built/vendor/'),
    ], handleError(done));
}

function zipper(done) {
    var targetDir = 'dist/';
    var themeName = require('./package.json').name;
    var filename = themeName + '.zip';

    pump([
        src([
            '**',
            '!node_modules', '!node_modules/**',
            '!dist', '!dist/**'
        ]),
        zip(filename),
        dest(targetDir)
    ], handleError(done));
}

const lessWatcher = () => watch('assets/less/**', comp_less);
const hbsWatcher = () => watch(['*.hbs', '**/**/*.hbs', '!node_modules/**/*.hbs'], hbs);
const jsWatcher = () => watch(['assets/js/*.js', '!node_modules/**/*.js'], js);

const watcher = parallel(lessWatcher, hbsWatcher, jsWatcher);
const build = series(comp_less, CopyMinAssets, js);
const dev = series(build, serve, watcher);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = dev;
