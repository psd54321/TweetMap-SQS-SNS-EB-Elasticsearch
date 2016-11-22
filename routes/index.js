var express = require('express');
var router = express.Router();
var request = require("request");
var Twitter = require('twit');
var Elasticsearch = require('aws-es');
var MessageValidator = require('sns-validator');
var validator = new MessageValidator();
validator.encoding = 'utf8';
var AWS = require('aws-sdk');
var sns = new AWS.SNS();

var client = new Twitter({
    consumer_key: '1hkOv5wjdTaqxsRM91FGwjkRU',
    consumer_secret: '04VmYHw6z56sSt1Ypm6BbgxweTLiM5ejFxdusWU7AqYYtP8Lf6',
    access_token: '218215924-qk6PxJv342X46C3AwMNFFCI5raOa7coBYCFRXmGo',
    access_token_secret: 'pKQKTqsm37kSFVysuKodhZ7BusEKZ8J9dS7Pv3jKjB4bY'
});

/* GET home page */
router.get('/', function (req, res) {
    res.render('index');
});


router.get('/search/:searchq', function (req, res) {
    var elasticsearch = new Elasticsearch({
        accessKeyId: 'AKIAIVRI3JUCHHHOE4VQ',
        secretAccessKey: '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',
        service: 'es',
        region: 'us-east-1',
        host: 'search-prathtweets-jqcnx3spdjo3rhy5zjzn4nusv4.us-east-1.es.amazonaws.com'
    });

    elasticsearch.search({
        index: 'twitter',
        type: 'tweet',
        size: 150,
        body: {
            query: {
                term: {
                    text: req.params.searchq
                }
            }
        }
    }, function (err, data) {
        res.json(data);
    });

});

router.post('/notify', function (req, res) {
    var io = global.socketio;
    console.log('inside notify');
    console.log(req.get('x-amz-sns-message-type'));
    if (req.get('x-amz-sns-message-type') == 'Notification') {
        console.log('inside notification');
        var tweet = JSON.parse(JSON.parse(req.body).Message).text;
        console.log(tweet);
        io.sockets.emit('tweet', (JSON.parse(req.body).Message));
       
    } else if (req.get('x-amz-sns-message-type') == 'SubscriptionConfirmation') {
        console.log('inside subscription');
        var token = JSON.parse(req.body).Token;
        var arn = JSON.parse(req.body).TopicArn;

        var params = {
            Token: token,
            TopicArn: arn
        };
        sns.confirmSubscription(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data); // successful response
        });

    } else {
        console.log('Illegal Notification Received');
    }
});

module.exports = router;
