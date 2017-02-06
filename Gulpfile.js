var gulp = require("gulp");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var watchify = require("watchify");
var tsify = require("tsify");
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');

class Watcher {
    constructor(outFile, inFiles) {
        this.inFiles = inFiles;
        this.outFile = outFile;
        this.bundler = null;
    }
}

const watchAndBrowserify = (files) => {
    return watchify(browserify({
        basedir: '.',
        debug: true,
        entries: files,
        cache: {},
        packageCache: {}
    }).plugin(tsify));
}

const bundle = (bundler, out) => {
    return () => {
        return bundler
            .bundle()
            .on('error', gutil.log)
            .pipe(source(out))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            // .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest("dist"));
    }
}

const watchers = new Map([
    // ['index', new Watcher('index.js', ['src/index.ts'])],
    ['background', new Watcher('background.js', ['src/background.ts'])],
    ['popup', new Watcher('popup.js', ['src/popup.ts'])],
    ['content', new Watcher('content.js', ['src/content.ts'])],
]);

watchers.forEach((watcher) => {
    const browserifier = watchAndBrowserify(watcher.inFiles);
    watcher.bundler = bundle(browserifier, watcher.outFile);
    browserifier.on("update", watcher.bundler);
    browserifier.on("log", gutil.log);
    browserifier.on("error", gutil.log);
});

gulp.task("default", () => {
    // watchers.get('index').bundler();
    watchers.get('background').bundler();
    watchers.get('popup').bundler();
    watchers.get('content').bundler();
});
