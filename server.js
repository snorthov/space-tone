/*eslint-env node, express*/

try {
	var dotenv = require('dotenv');
	dotenv.load({silent: true});
} catch (error) {
	console.log(error);
}

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
var TEST_TEXT =  'As the use of typewriters grew in the late 19th century, the phrase began appearing in typing lesson books as a practice sentence. Early examples include How to Become Expert in Typewriting: A Complete Instructor Designed Especially for the Remington Typewriter (1890),[5] and Typewriting Instructor and Stenographers Hand-book (1892). By the turn of the 20th century, the phrase had become widely known. In the January 10, 1903, issue of Pitmans Phonetic Journal, it is referred to as "the well known memorized typing line embracing all the letters of the alphabet".[6] Robert Baden-Powells book Scouting for Boys (1908) uses the phrase as a practice sentence for signaling.[1]';

var toneAnalyzer;
try {
	var ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');
	var { IamAuthenticator } = require('ibm-watson/auth');
	toneAnalyzer = new ToneAnalyzerV3({
		version: '2019-10-10',
		authenticator: new IamAuthenticator({
			apikey: process.env.TONE_ANALYZER_IAM_APIKEY,
		}),
		url: process.env.TONE_ANALYZER_URL,
	});
} catch (error) {
	console.log(error);
}

console.log("TONE_ANALYZER: " + toneAnalyzer);

var twitterClient;
try {
	var Twitter = require('twitter');
	twitterClient = new Twitter({
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	});
} catch (error) {
	console.log(error);
}
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
	if (twitterClient) {
		twitterClient.get('statuses/user_timeline', tweetParams, /* @callback */ function(err, tweets, res2) {
			if (err) {
				console.log("TWITTER_ERROR: " + screen_name + " " + err.message);
				res.status(500);
				res.json(err);
				return;
			}
			console.log("TWITTER_SUCCESS: " + screen_name);
			var tweets = tweets.map(function(x) {return x["text"];});
			var tweets = tweets.reduce(function (p, n) {return p + "\n" + n;}, "");
			//console.log(tweets);
			var toneParams = {
				toneInput : tweets, // TEST_TEXT,
				contentType : "text/plain;charset=utf-8"
			};
			if (toneAnalyzer) {
				toneAnalyzer.tone(toneParams, function(err, data) {
					if (err) {
						console.log("TONE_ERROR: " + screen_name + " " + err.message);
						res.status(err.code);
						res.json(err.message);
					} else {
						console.log("TONE_SUCCESS: " + screen_name + " ");
						res.json(data);
					}
				});
			} else {
				res.status(500);
				res.json("GET_TONE: Tone Analysis has not been initialized");
			}
		});
	} else {
		res.status(500);
		res.json("GET_TONE: Twitter has not been initialized");
	}
});

// listen for requests on the host at a port
var port = process.env.VCAP_APP_PORT || process.env.PORT || process.env.port || 3000;
app.listen(port, function() {
	console.log('Server running on port: %d', port);
});

