var express = require('express');
var router = express.Router();
var request = require("request");
var Twitter = require('twit');
var Elasticsearch = require('aws-es');
var MessageValidator = require('sns-validator');
var validator = new MessageValidator();
validator.encoding = 'utf8';

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
    console.log('inside notify');
    console.log(req.get('x-amz-sns-message-type'));
    if(req.get('x-amz-sns-message-type') == 'Notification') {
        console.log('inside notification');
                var tweet = JSON.parse(JSON.parse(req.body).Message).text;
        // extract sentiment info from DB
        //io.sockets.emit('tweet','message sent notification'+tweet);
    } else if(req.get('x-amz-sns-message-type') == 'SubscriptionConfirmation') {
        console.log('inside subscription');
        var subscribeURL = req.body.SubscribeURL;
        console.log(subscribeURL);
        console.log('after url');
        https.get(subscribeURL, function(res) {
            console.log('Subscription Confirmed!');
            res.on('data', function(chunk) {
                console.log('' + chunk);
                io.sockets.emit('tweet','message sent subscription confirmed');
            });
        }).on('error', function(e) {
             io.sockets.emit('tweet','message sent notify error');
            console.log(e);
        });
    } else {
        console.log('Illegal Notification Received');
         //io.sockets.emit('tweet','message sent notify illegal');
    }
});

module.exports = router;
