var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var connectedCount = 0;
var request = require("request");
var Twitter = require('twit');
var Elasticsearch = require('aws-es');

var client = new Twitter({
    consumer_key: '1hkOv5wjdTaqxsRM91FGwjkRU',
    consumer_secret: '04VmYHw6z56sSt1Ypm6BbgxweTLiM5ejFxdusWU7AqYYtP8Lf6',
    access_token: '218215924-qk6PxJv342X46C3AwMNFFCI5raOa7coBYCFRXmGo',
    access_token_secret: 'pKQKTqsm37kSFVysuKodhZ7BusEKZ8J9dS7Pv3jKjB4bY'
});

 var elasticsearch = new Elasticsearch({
        accessKeyId: 'AKIAIVRI3JUCHHHOE4VQ',
        secretAccessKey: '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',
        service: 'es',
        region: 'us-east-1',
        host: 'search-prathtweets-jqcnx3spdjo3rhy5zjzn4nusv4.us-east-1.es.amazonaws.com'
    });

var routes = require('./routes/index');

var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(function (req, res, next) {
    res.io = io;
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var topics = 'trump,love,music,pizza,food,pumpkin,apple';
var stream = client.stream('statuses/filter', {
    track: topics
}, {
    locations: ['-180', '-90', '180', '90']
});


stream.on('tweet', function (tweet) {
    if (tweet.geo != null) { // Insert into elastic search when tweet with location is found

        elasticsearch.index({
            index: 'twitter',
            type: 'tweet',
            body: {
                'username': tweet.user.name,
                'text': tweet.text,
                'location': tweet.geo
            }
        }, function (err, data) {
            console.log("Tweet " + " with location: " + JSON.stringify(tweet.geo.coordinates) + "inserted.");

        });

    }
});

stream.stop();
console.log('Stream Stopped');

io.on('connection', function (socket) {
    connectedCount++;
    console.log(connectedCount);
    if (connectedCount == 1) {
        stream.start();
        console.log('Strem started');
        io.sockets.emit('tweet','message sent');
    }

    socket.on('disconnect', function () {
        connectedCount--;
        console.log(connectedCount);
        console.log('user disconnected');
        if (connectedCount == 0) {
            stream.stop();
        }
    });
});

module.exports = {
    app: app,
    server: server
};
