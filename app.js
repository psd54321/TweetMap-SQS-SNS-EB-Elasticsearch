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
var AWS = require('aws-sdk');
var awsconfig = require('./config/awsconfig');
var workerpool = require('workerpool');
var twitconfig = require('./config/twitconfig');
var topics = 'trump,love,music,pizza,food,pumpkin,apple';
var stopped = true;


var pool = workerpool.pool(__dirname + '/controllers/worker.js');

var client = new Twitter({
    consumer_key: twitconfig.consumer_key,
    consumer_secret: twitconfig.consumer_secret,
    access_token: twitconfig.access_token,
    access_token_secret: twitconfig.access_token_secret
});

var stream1 = client.stream('statuses/filter', {
    track: topics
}, {
    locations: ['-180', '-90', '180', '90']
});

var elasticsearch = new Elasticsearch({
    accessKeyId: awsconfig.accessKey,
    secretAccessKey: awsconfig.secretAccessKey,
    service: 'es',
    region: 'us-east-1',
    host: awsconfig.elasticsearchendpoint
});

AWS.config.update({
    'accessKeyId': awsconfig.accessKey,
    'secretAccessKey': awsconfig.secretAccessKey,
    'region': awsconfig.region
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

global.socketio = io;
app.use(bodyParser.text());
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

//initialize AWS SQS
var attributes = {
    "Version": "2016-10-17",
    "Id": "Queue1_Policy_UUID",
    "Statement": [
        {
            "Sid": "Queue1_AnonymousAccess_ReceiveMessage",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "sqs:*",
            "Resource": "arn:aws:sqs:us-east-1:341233333632:psd281tweets"
    }
  ]
};
var sqs = new AWS.SQS();
var sqsSetParams = {
    QueueUrl: awsconfig.queueUrl,
    Attributes: {
        'Policy': JSON.stringify(attributes)
    }
};

//set SQS attribute
sqs.setQueueAttributes(sqsSetParams, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
});

var sqsSendParams = {
    QueueUrl: awsconfig.queueUrl,
    MessageAttributes: {
        someKey: {
            DataType: 'String',
            StringValue: "string"
        }
    }
};


//Twitter stream
stream1.on('tweet', function (tweet) {
    if (stopped) {
        stream1.stop();
    }
    if (tweet.geo != null) { // Insert into elastic search when tweet with location is found

        var obj = {
            'username': tweet.user.name,
            'text': tweet.text,
            'location': tweet.geo
        };

        sqsSendParams.MessageBody = JSON.stringify(obj);
        //send message to SQS
        console.log('send message');
        sqs.sendMessage(sqsSendParams, function (err, data) {
            if (err) console.log(err, err.stack);
        });

    }
});



// Handle stream open close based on connected sockets
io.on('connection', function (socket) {
    connectedCount++;
    console.log(connectedCount);
    if (connectedCount == 1) {
        stopped = false;
        stream1.start();
        console.log('Stream started');
    }

    socket.on('disconnect', function () {
        connectedCount--;
        console.log(connectedCount);
        console.log('user disconnected');
        if (connectedCount == 0) {
            stream1.stop();
            stopped = true;
        }
    });
});

var getMessageFromSQS = function () {
    var sqsRecieveParams = {
        QueueUrl: awsconfig.queueUrl,
        MaxNumberOfMessages: 10
    };
    //receive message from SQS
    sqs.receiveMessage(sqsRecieveParams, function (err, data) {
        if (data && data.Messages && data.Messages.length > 0) {
            var len = data.Messages.length;
            for (var i = 0; i < len; i++) {
                console.log('receive message');
                var message = data.Messages[i];
                var body = message.Body;
                //console.log(body);
                //do sentiment analysis
                pool.exec('TweetSentimentAnalysis', [body]);
                deleteMessageFromSQS(message);
            }
        }
    });
};

setInterval(getMessageFromSQS, 100);

//delete message from SQS
var deleteMessageFromSQS = function (message) {
    var sqsDeleteParams = {
        QueueUrl: awsconfig.queueUrl,
        ReceiptHandle: message.ReceiptHandle
    };
    sqs.deleteMessage(sqsDeleteParams, function (err, data) {
        if (err) console.log(err);
    });
};

//subscribe message
var sns = new AWS.SNS();
var snsSubscribeParams = {
    Protocol: 'http',
    TopicArn: awsconfig.snsTopicARN,
    Endpoint: 'http://node-express-env.avpvzxmmka.us-east-1.elasticbeanstalk.com/notify'
};

sns.subscribe(snsSubscribeParams, function (err, data) {
    console.log(data);
});



module.exports = {
    app: app,
    server: server
};
