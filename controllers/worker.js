var AWS = require('aws-sdk');
var awsconfig = require('../config/awsconfig');
var workerpool = require('workerpool');
var AlchemyLanguageV1 = require('watson-developer-cloud/alchemy-language/v1');

var alchemy_language = new AlchemyLanguageV1({
    api_key: awsconfig.alchemykey
});

var topics = ['trump', 'love', 'music', 'pizza', 'food', 'pumpkin', 'apple'];
var i = 0;

AWS.config.update({
    'accessKeyId': awsconfig.accessKey,
    'secretAccessKey': awsconfig.secretAccessKey,
    'region': awsconfig.region
});


var sns = new AWS.SNS();
var snsPublishParams = {
    TopicArn: awsconfig.snsTopicARN,
    MessageAttributes: {}
};


AWS.config.update({
    'accessKeyId': awsconfig.accessKey,
    'secretAccessKey': awsconfig.secretAccessKey,
    'region': awsconfig.region
});

function TweetSentimentAnalysis(message) {
    var obj = JSON.parse(message);
    var params = {
        text: obj.text
    };

    var lowercase = obj.text.toLowerCase();
    for (i = 0; i < topics.length; i++) {
        if (lowercase.indexOf(topics[i]) != -1) {
            obj.topic = topics[i];
        }
    }

    alchemy_language.sentiment(params, function (err, response) {
        if (null != response && response.docSentiment != undefined && response.docSentiment.type != undefined) {
            obj.sentiment = response.docSentiment.type;
            if (obj.sentiment == 'neutral') {
                obj.sentiscore = 0;
            } else obj.sentiscore = response.docSentiment.score;
            console.log(response.docSentiment.score);
            snsPublishParams.Message = JSON.stringify(obj);
            //  console.log('sentimentAnalysis done');
            sns.publish(snsPublishParams, function (err, data) {
                if (err) console.log(err);
            });
        }
    });
}




workerpool.worker({
    TweetSentimentAnalysis: TweetSentimentAnalysis
});
