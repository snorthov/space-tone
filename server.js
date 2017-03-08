/*eslint-env node, express*/

var dotenv = require('dotenv');
dotenv.load({silent: true});

var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();

var GET_ASTROS = "/astros";
var ASTROS_JSON = "public/astros.json";
var GET_ASTROS_OPEN_NOTIFY = "http://api.open-notify.org/astros.json";

// Serve static content from /public
app.use('/', express.static(__dirname + "/public"));

var count = 0;
function suffix(n) {
	return n === 0 ? "" : String(n);
}

// GET the people in space from a file (v )
app.get(GET_ASTROS + suffix(count++), /* @callback */ function (req, res) {
	res.sendfile(ASTROS_JSON);
});

// GET the people in space from the Open Notify API
app.get(GET_ASTROS + suffix(count++), /* @callback */ function(req, resp) {
	http.get(GET_ASTROS_OPEN_NOTIFY, function(resp2) {
		var body = "";
		resp2.on("data", function(data) {
			body += data;
		});
		resp2.on("end", function() {
			resp.send(JSON.parse(body));
		});
	});
});

// GET the people in space from a file (v2)
app.get(GET_ASTROS + suffix(count++), /* @callback */ function (req, res) {
	fs.readFile(ASTROS_JSON, "utf8", function (err, data) {
		if (err) {
			//TODO - send better error message
			res.send(err);
		} else {
			res.send(JSON.parse(data));
		}
	});
});

var GET_TONE = "/tone";

var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
var toneAnalyzer = new ToneAnalyzerV3({
	"url": "https://gateway.watsonplatform.net/tone-analyzer/api",
	"username": process.env.TONE_ANALYZER_USERNAME,
	"password": process.env.TONE_ANALYZER_PASSWORD,
	"version_date": '2016-05-19'
});
console.log("TONE_ANALYZER: " + toneAnalyzer);

var Twitter = require('twitter');
var twitterClient = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
console.log("TWITTER_CLIENT: " + twitterClient);

app.get(GET_TONE, /* @callback */ function(req, res) {
	var screen_name = req.param('screen_name') || "";
	if (screen_name && screen_name.charAt(0) === "@") {
		screen_name = screen_name.substring(1);
	}
	console.log("GET_TONE: " + screen_name);
	var tweetParams = {
		"screen_name": screen_name,
		count: 2000
	};
	twitterClient.get('statuses/user_timeline', tweetParams, /* @callback */ function(err, tweets, res2) {
		if (err) {
			console.log("TWITTER_ERROR: " + screen_name + " " + err.message);
			res.status(500);
			res.json(err.message);
			return;
		}
		console.log("TWITTER_SUCCESS: " + screen_name);
		var tweets = tweets.map(function(x) {return x["text"];});
		var tweets = tweets.reduce(function (p, n) {return p + "\n" + n;}, "");
		var toneParams = {
			text : tweets
		};
		toneAnalyzer.tone(toneParams, function(err, data) {
			if (err) {
				console.log("TONE_ERROR: " + screen_name + " " + err.error);
				res.status(err.code);
				res.json(err);
			} else {
				console.log("TONE_SUCCESS: " + screen_name + " ");
				res.json(data);
			}
		});
	});
});

// listen for requests on the host at a port
var port = process.env.VCAP_APP_PORT || process.env.PORT || process.env.port || 3000;
app.listen(port, function() {
	console.log('Server running on port: %d', port);
});

