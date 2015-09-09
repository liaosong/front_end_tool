var gulp = require('gulp');
var jade = require('gulp-jade');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var fs = require('fs');
var _ = require('lodash');

// var watch = require('gulp-watch');

var PROXY_SERVER_ADDR = "http://localhost:4000";

var paths = {
  app: 'app/',
  dist: 'dist/',
  css_lib_name: 'lib.css',
  scss_dist_name: 'style.css',
  css_dist: 'dist/styles',
  src_js_name: 'app.js',
  js_dist: 'dist/js/',
  lib_js_name: 'lib.js',
  js_vendor: 'dist/vendor',
  fonts: ['app/fonts/*.*'],
  dist_fonts: 'dist/fonts',
  images: ['app/images/*.*'],
  dist_images: 'dist/images',
  js: [
    'app/*.js',
    'app/js/*.js',
    'app/js/*/*.js'
  ],
  jade: [
    'app/index.jade',
    'app/partials/*/*.jade',
    'app/partials/*.jade'
  ],
  scss: [
    'app/styles/*.scss',
    'app/styles/*/*.scss'
  ],
  src_scss: 'app/styles/style.scss',
  js_lib: [
    'deps/jquery/dist/jquery.js',
    'deps/angular/angular.js',
    'compat/zh-cn.js',
    'deps/ui-router/release/angular-ui-router.js',
    'deps/angular-bootstrap/ui-bootstrap-tpls.js',
    'deps/ngDialog/js/ngDialog.js',
    'deps/holderjs/holder.min.js',
    'deps/angular-holderjs/src/holder.js',
    'deps/ng-flow/dist/ng-flow-standalone.js',
    'deps/angular-datepicker/dist/index.js',
    'deps/lodash/lodash.js',
    'deps/sweetalert/dist/sweetalert.min.js',
    'deps/ng-sweet-alert/ng-sweet-alert.js'
  ],
  css_lib: [
    'deps/bootstrap/dist/css/bootstrap.css',
    'deps/ngDialog/css/ngDialog.min.css',
    'deps/angular-datepicker/dist/index.css',
    'deps/sweetalert/dist/sweetalert.css'
  ]

}

var generate_scripts = function(){
  var files = fs.readdirSync("dist/vendor");

  return _.sortBy(files, function(fileName){

    return _.findIndex(paths.js_lib, function(path){

      return path.indexOf(fileName) != -1;
    });

  });
}



//compile jade
gulp.task('jade-compile', function() {
  gulp.src(paths.jade, {base:'app'})
    .pipe(jade({pretty: true}))
    .pipe(gulp.dest(paths.dist));
});

//将js文件打包到一个文件中
gulp.task('js-concat', function() {
  gulp.src(paths.js)
    .pipe(sourcemaps.init())
    .pipe(concat(paths.src_js_name))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.js_dist));
});
//将js库文件打包到一个文件中
gulp.task('jslib-concat', function() {
  gulp.src(paths.js_lib)
    .pipe(concat(paths.lib_js_name))
    .pipe(gulp.dest(paths.js_dist))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest(paths.js_dist));
});

//将scss编译成css，并输出到指定目录
// gulp.task('scss-compile', function(){
//   gulp.src(paths.scss)
//     .pipe(sourcemaps.init())
//     .pipe(sass())
//     .pipe(concat(paths.scss_dist_name))
//     .pipe(sourcemaps.write())
//     .pipe(gulp.dest(paths.css_dist))
//     .pipe(livereload());

// });

gulp.task('scss-compile', function(){
  gulp.src(paths.src_scss)
    .pipe(sass())
    .pipe(gulp.dest(paths.css_dist))
    .pipe(livereload());

});


//第三方css
gulp.task('csslib-concat', function() {
  gulp.src(paths.css_lib)
    .pipe(sourcemaps.init())
    .pipe(concat(paths.css_lib_name))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.css_dist));
});

gulp.task('copy', function(){
  gulp.src(paths.js_lib)
    .pipe(gulp.dest(paths.js_vendor));

  gulp.src(paths.fonts)
    .pipe(gulp.dest(paths.dist_fonts));

  gulp.src(paths.images)
    .pipe(gulp.dest(paths.dist_images));
});

gulp.task('watch', function(e){
  livereload.listen();
  gulp.watch(paths.jade, ['jade-compile']);
  gulp.watch(paths.scss, ['scss-compile']);
  gulp.watch(paths.js, ['js-concat']);

  gulp.watch(["dist/js/app.js",
    "dist/styles/web.css",
    "dist/partials/**/*.html",
    "dist/partials/*.html",
    "dist/index.html"])
        .on("change",livereload.changed);
});

gulp.task('clean-dist', function(){
  return gulp.src(paths.dist, {read: false})
    .pipe(clean({force:true}));
});

gulp.task('express', ['copy'], function(){
  var express = require("express");
  var bodyParser = require('body-parser');
  var url = require('url');
  var app = express();
  var proxyOptions = url.parse(PROXY_SERVER_ADDR);
  var proxy = require('./compat/proxy-middleware')
  // proxyOptions.route = '/api';
  proxyOptions.statics = ['/js', '/vendor', '/styles', '/images', '/partials', '/fonts'];

  app.set('views', __dirname + '/app/');
  app.set('view engine', 'jade');

  //反向代理 webapi
  app.use(proxy(proxyOptions));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());

  app.use("/js", express.static("dist/js"));
  app.use("/vendor", express.static("dist/vendor"));
  app.use("/styles", express.static("dist/styles"));
  app.use("/images", express.static("dist/images"));
  app.use("/partials", express.static("dist/partials"));
  app.use("/fonts", express.static("dist/fonts"));
  app.listen(9001);
  var libs = generate_scripts();
  var testUser = {
    name: '醉池明月'
  }

  app.get("/", function(req, res, next){
    res.render('index', {libs: libs, debugMode: true, meta: testUser});
  });
});


gulp.task('default', [
  // 'clean-dist',
  'jade-compile',
  'scss-compile',
  'csslib-concat',
  'jslib-concat',
  'js-concat',
  'express',
  'watch'
]);