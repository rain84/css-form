import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import bs from 'browser-sync';
import del from 'del';
import async from 'async-tiny';

const $   = gulpLoadPlugins();
const dir = {
  src  : 'src',
  dist : 'dist',
  tmp  : '.tmp',
};

let subTask = {
  sass   : sass,
  clean  : clean,
  copy   : copy,
  inject : inject,
};

for ( let prop in subTask ) {
  let fn = subTask[prop];

  subTask[prop] = ( defer ) => {
    "use strict";

    let result = fn();
    result && result.pipe && result.pipe( $.callback( () => done( defer ) ) )
    || done( defer );
  };
}

gulp.task( 'serve', serve );
gulp.task( 'clean', subTask.clean );
gulp.task( 'copy', subTask.copy );

function serve() {
  async( [subTask.clean, subTask.sass, subTask.copy, subTask.inject] )
    .then( ( defer ) => {
      "use strict";

      bs.init(
        {
          notify : true,
          server : {
            baseDir : ['.tmp'],
            routes  : {
              '/bower_components' : 'bower_components'
            }
          },
          port   : 3000
        } );

      gulp.watch( [dir.src + '/**/*.html'], () => async( [subTask.copy, subTask.inject] ).then( bs.reload ) );
      gulp.watch( [dir.src + '/**/*.sass'], () => async( [subTask.sass] ).then( bs.reload ) );
    } )
    .then( ()=> console.log( 'Task "serve" done' ) )
  ;
}

function sass() {
  return gulp.src( dir.src + '/**/*.sass' )
    .pipe( $.newer( dir.tmp ) )
    .pipe( $.sass().on( 'error', $.sass.logError ) )
    .pipe( $.autoprefixer( { browsers : ['last 2 versions', 'ie >= 7'], cascade : true } ) )
    .pipe( $.concat( 'style.css' ) )
    .pipe( gulp.dest( dir.tmp ) )
    .pipe( $.callback( ()=> console.log( 'Task "sass" done' ) ) )
    ;
}

function clean() {
  del( ['.tmp/*', 'dist/*', '!dist/.git'], { dot : true } );
  console.log( 'Task "clean" done' );
}

function inject() {
  "use strict";

  return gulp.src( dir.tmp + '/index.html' )
    .pipe( $.inject( gulp.src( dir.tmp + '/style.css' ), { relative : true } ) )
    .pipe( gulp.dest( dir.tmp ) )
    .pipe( $.callback( ()=> console.log( 'Task "inject" done' ) ) )
    ;
}


function copy() {
  return gulp.src( dir.src + '/**/*.html' )
    .pipe( $.newer( dir.tmp ) )
    .pipe( gulp.dest( dir.tmp ) )
    .pipe( $.callback( ()=> console.log( 'Task "copy" done' ) ) )
    ;
}

function done( defer ) {
  "use strict";
  defer && defer.resolve && defer.resolve();
}
