 //生成一个express 实例 app
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./settings');
var flash =require('connect-flash');//引入 flash 模块来实现页面通知（即成功与错误信息的显示）的功能。
var app = express();

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

/*
session
 */

 app.use(session({
  secret: settings.cookieSecret,
  key: settings.db, //cookie name
  cookie: {maxAge: 1000*60*60*24*30},//30days
  store: new MongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port,
  })
 }))

// 设置 views 文件夹为存放视图文件的目录, __dirname为全局变量，存储当前正在执行的脚本所在目录
app.set('views', path.join(__dirname, 'views'));
//设置视图模板引擎为ejs
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(flash());
//加载日志中间件
app.use(logger('dev'));
//加载解析json的中间件
app.use(bodyParser.json());
//加载解析urlencoded请求体的中间件。
app.use(bodyParser.urlencoded({ extended: false }));
//加载解析cookie的中间件。
app.use(cookieParser());
//设置public文件夹为存放静态文件的目录。
app.use(express.static(path.join(__dirname, 'public')));
//路由控制器
/*app.use('/', routes);
app.use('/users', users);*/
routes(app);




// 捕获404错误，并转发到错误处理器
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
//开发环境下的错误处理器，将错误信息渲染error模版并显示到浏览器中。
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// 生产环境下的错误处理器，将错误信息渲染error模版并显示到浏览器中。
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//导出app实例供其他模块调用
module.exports = app;
