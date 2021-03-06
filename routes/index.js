var crypto = require('crypto'),
      User =require('../models/user.js'),
      Post = require('../models/post.js');
var express = require('express');
var router = express.Router();
var session = require('express-session');
/*
引入 crypto 模块和 user.js 用户模型文件，
crypto 是 Node.js 的一个核心模块，我们用它生成散列值来加密密码。
 */

/* GET home page. */
/*生成一个路由实例用来捕获访问主页的GET请求，
导出这个路由并在app.js中通过app.use('/', routes); 加载。
这样，当访问主页时，就会调用res.render('index', { title: 'Express' });
渲染views/index.ejs模版并显示到浏览器中。*/
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/
/*
我们当然可以不要 routes/index.js 文件，
把实现路由功能的代码都放在 app.js 里，
但随着时间的推移 app.js 会变得臃肿难以维护，
这也违背了代码模块化的思想，
所以我们把实现路由功能的代码都放在 routes/index.js 里。
官方给出的写法是在 app.js 中实现了简单的路由分配，
然后再去 index.js 中找到对应的路由函数，最终实现路由功能。
我们不妨把路由控制器和实现路由功能的函数都放到 index.js 里，
app.js 中只有一个总的路由接口。

 */
module.exports = function(app) {
  app.get('/', function(req, res) {
    Post.get(null, function(err, posts) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: '主页',
        user: req.session.user,
        posts: posts,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

//如果用户没有登陆才能进入 注册页
  app.get('/reg', checkNotLogin);
  app.get('/reg', function(req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  })


  app.post('/reg', checkNotLogin);
  app.post('/reg', function(req, res) {
    var name = req.body.name,
      password = req.body.password,
      password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if (password_re != password) {
      req.flash('error', '两次输入的密码不一致!');
      return res.redirect('/reg'); //返回注册页
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: name,
      password: password,
      email: req.body.email
    });
    //检查用户名是否已经存在 
    User.get(newUser.name, function(err, user) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      if (user) {
        req.flash('error', '用户已存在!');
        return res.redirect('/reg'); //返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function(err, user) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/reg'); //注册失败返回主册页
        }
        req.session.user = user; //用户信息存入 session
        req.flash('success', '注册成功!');
        res.redirect('/'); //注册成功后返回主页
      });
    });
  });

  //如果用户没有登陆，才能进入登陆页
  app.get('/login', checkNotLogin);
  app.get('/login', function(req, res) {
    res.render('login', {
      title: '登陆',
      user: req.session.user,
      success: req.flash('success').toString(),
      err: req.flash('error').toString()
    });
  })
  
  app.post('/login', checkNotLogin);
  app.post('/login', function(req, res) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function(err, user) {
      if (!user) {
        req.flash('error', '用户不存在!');
        return res.redirect('/login'); //用户不存在则跳转到登录页
      }
      //检查密码是否一致
      if (user.password != password) {
        req.flash('error', '密码错误!');
        return res.redirect('/login'); //密码错误则跳转到登录页
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
      req.flash('success', '登陆成功!');
      res.redirect('/'); //登陆成功后跳转到主页
    });
  });

  /**
   *发布
   * 
   */

  //只有用户登陆了才能进入发布页
  app.get('/post',checkLogin);
  app.get('/post', function(req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/post',checkLogin);
  app.post('/post', function(req, res) {
    var currentUser = req.session.user,
          post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function(err) {
      if(err){
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success','发布成功');
      res.redirect('/');
    })
  });

  /*
  
  登出

   */
  //只有登陆了才能登出
  app.get('/logout',checkLogin);
  app.get('/logout', function(req, res) {
    //通过把 req.session.user 赋值 null 丢掉 session 中用户的信息，实现用户的退出
    req.session.user = null;
    req.flash('success','登出成功!');
    req.redirect('/'); //登出成功后跳转到主页
  });


  /*
  我们可以把用户登录状态的检查放到路由中间件中，
  在每个路径前增加路由中间件，即可实现页面权限控制。
  我们添加 checkNotLogin 和 checkLogin 函数来实现这个功能。
   */
  function checkLogin(req, res, next){
    if(!req.session.user) {
      req.flash('error', '未登录!');
      res.redirect('/login');
    }
    next();
  }
  function checkNotLogin(req, res, next) { 
    if(req.session.user) {
      req.flash('error', '已登陆');
      res.redirect('back');
    }
    next();
  }

}
