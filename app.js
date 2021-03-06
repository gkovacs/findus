// Generated by IcedCoffeeScript 1.3.3f
(function() {
  var alphanumeric, app, express, generateRandomLowercaseAlphabeticString, http, httport, httpserver, isAlphanumericString, lowercasealphabet, pageToUsers, webRoot, _ref;

  express = require('express');

  app = express();

  http = require('http');

  httpserver = http.createServer(app);

  httport = (_ref = process.env.PORT) != null ? _ref : 5000;

  httpserver.listen(httport, '0.0.0.0');

  webRoot = 'http://findus.herokuapp.com/';

  app.configure('development', function() {
    return app.use(express.errorHandler());
  });

  app.configure(function() {
    app.set('views', __dirname + '/static');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.set('view options', {
      layout: false
    });
    app.locals({
      layout: false
    });
    app.use(express["static"](__dirname + '/static'));
    return app.use(app.router);
  });

  app.get('/', function(req, res) {
    var target;
    target = generateRandomLowercaseAlphabeticString(7);
    return res.redirect(target);
  });

  lowercasealphabet = 'abcdefghijklmnopqrstuvwxyz';

  generateRandomLowercaseAlphabeticString = function(length) {
    var curChar, output;
    output = [];
    while (output.length < length) {
      curChar = lowercasealphabet[Math.floor(Math.random() * lowercasealphabet.length)];
      output.push(curChar);
    }
    return output.join('');
  };

  alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  isAlphanumericString = function(str) {
    var c, _i, _len;
    for (_i = 0, _len = str.length; _i < _len; _i++) {
      c = str[_i];
      if (alphanumeric.indexOf(c) === -1) return false;
    }
    return true;
  };

  pageToUsers = {};

  app.get('/sendInfo', function(req, res) {
    var currentTime, currentUserId, latitude, longitude, pageid, userid, usersToDelete, _i, _len;
    pageid = req.query.pageid;
    userid = req.query.userid;
    latitude = parseFloat(req.query.latitude);
    longitude = parseFloat(req.query.longitude);
    if (!(pageid != null) || !(userid != null) || !(latitude != null) || !(longitude != null)) {
      res.send(404);
      return;
    }
    if (!(pageToUsers[pageid] != null)) pageToUsers[pageid] = {};
    if (!(pageToUsers[pageid][userid] != null)) pageToUsers[pageid][userid] = {};
    currentTime = Math.round(new Date().getTime() / 1000.0);
    pageToUsers[pageid][userid].updateTime = currentTime;
    pageToUsers[pageid][userid].latitude = latitude;
    pageToUsers[pageid][userid].longitude = longitude;
    usersToDelete = [];
    for (currentUserId in pageToUsers[pageid]) {
      if (pageToUsers[pageid][currentUserId].updateTime + 86400 < currentTime) {
        usersToDelete.push(currentUserId);
      }
    }
    for (_i = 0, _len = usersToDelete.length; _i < _len; _i++) {
      currentUserId = usersToDelete[_i];
      delete pageToUsers[pageid][currentUserId];
    }
    return res.send(JSON.stringify(pageToUsers[pageid]));
  });

  app.get('/getInfo', function(req, res) {
    var currentTime, currentUserId, pageid, usersToDelete, _i, _len;
    pageid = req.query.pageid;
    if (!(pageid != null)) {
      res.send(404);
      return;
    }
    if (!(pageToUsers[pageid] != null)) {
      res.send('{}');
      return;
    }
    currentTime = Math.round(new Date().getTime() / 1000.0);
    usersToDelete = [];
    for (currentUserId in pageToUsers[pageid]) {
      if (pageToUsers[pageid][currentUserId].updateTime + 86400 < currentTime) {
        usersToDelete.push(currentUserId);
      }
    }
    for (_i = 0, _len = usersToDelete.length; _i < _len; _i++) {
      currentUserId = usersToDelete[_i];
      delete pageToUsers[pageid][currentUserId];
    }
    return res.send(JSON.stringify(pageToUsers[pageid]));
  });

  app.get('/*', function(req, res) {
    var pageid, webpageURIEncoded;
    pageid = req.params[0];
    if (!isAlphanumericString(pageid)) {
      return res.send(404);
    } else {
      console.log('rendering');
      webpageURIEncoded = encodeURI(webRoot + pageid);
      return res.render('main.ejs', {
        'pageid': pageid,
        'webRoot': webRoot,
        'webpage': webRoot + pageid,
        'webpageSansHTTP': webRoot.slice(7) + pageid,
        'webpageURIEncoded': webpageURIEncoded
      }, function(err, html) {
        console.log('done rendering');
        console.log(err);
        console.log(html);
        return res.send(html);
      });
    }
  });

}).call(this);
