var request = require("request");
var Twitter = require('twit');
var Elasticsearch = require('aws-es');

var client = new Twitter({
    consumer_key: 'Your key',
    consumer_secret: 'Your key secret',
    access_token: 'Your access token',
    access_token_secret: 'Your token secret'
});
//Pushing tweets into elastic search.
var topics = 'trump';

var elasticsearch = new Elasticsearch({
                            accessKeyId:'Your access key',
                            secretAccessKey:'Your access key secret',
                            service:'es',
                            region:'us-east-1',
                            host:'Your host'
                        });
console.log(elasticsearch);


var stream = client.stream('statuses/filter', {track: topics}, {locations: ['-180','-90','180','90']});

    stream.on('tweet', function(tweet) {
        if(tweet.geo != null) { // Insert into elastic search when tweet with location is found
            console.log("Tweet: "+tweet.text);

            elasticsearch.index({
            index: 'twitter',
            type: 'tweet',
            body: {
                'username': tweet.user.name,
                    'text': tweet.text,
                    'location': tweet.geo
            }
        }, function(err, data) {
           console.log("Row "+err+"@@@@ "+JSON.stringify(data)+" with location: "+JSON.stringify(tweet.geo.coordinates));
        });
            
        }
    });
    stream.on('error', function(error) {
        throw error;
    });
