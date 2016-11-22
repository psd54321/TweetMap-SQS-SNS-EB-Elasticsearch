var express = require('express');
var router = express.Router();
var request = require("request");
var Twitter = require('twit');
var Elasticsearch = require('aws-es');
var MessageValidator = require('sns-validator');
var validator = new MessageValidator();
validator.encoding = 'utf8';
var AWS = require('aws-sdk');
var twitconfig = require('../config/twitconfig');
var sns = new AWS.SNS();
var awsconfig = require('../config/awsconfig');

var client = new Twitter({
    consumer_key: twitconfig.consumer_key,
    consumer_secret: twitconfig.consumer_secret,
    access_token: twitconfig.access_token,
    access_token_secret: twitconfig.access_token_secret
});

var elasticsearch = new Elasticsearch({
    accessKeyId: awsconfig.accessKey,
    secretAccessKey: awsconfig.secretAccessKey,
    service: 'es',
    region: 'us-east-1',
    host: awsconfig.elasticsearchendpoint
});


/* GET home page */
router.get('/', function (req, res) {
    res.render('index');
});


router.get('/search/:searchq', function (req, res) {

    elasticsearch.search({
        index: 'twittersentimentanalysis',
        type: 'tweet',
        size: 200,
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
        var tweet = JSON.parse(JSON.parse(req.body).Message);
        console.log(tweet);
        console.log(tweet.username);
        console.log(tweet.sentiment);
        console.log(tweet.sentiscore);
        elasticsearch.index({
            index: 'twittersentimentanalysis',
            type: 'tweet',
            body: {
                'username': tweet.username,
                'text': tweet.text,
                'location': tweet.location,
                'sentiment': tweet.sentiment,
                'sentiscore': tweet.sentiscore
            }
        }, function (err, data) {
            //console.log("Tweet " + " with location: " + JSON.stringify(tweet.geo.coordinates) + "inserted.");

        });
        io.sockets.emit('tweet', tweet);

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
