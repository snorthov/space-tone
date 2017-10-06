try {
	var dotenv = require('dotenv');
	dotenv.load({silent: true});
} catch (error) {
	console.log(error);
}

var NAME = "space-tone";
var TEST_URL = "https://" + NAME + ".mybluemix.net/";

var webdriver = require('selenium-webdriver');
var USER_NAME = process.env.SAUCE_USERNAME;
var ACCESS_KEY = process.env.SAUCE_ACCESS_KEY;

//TODO - Test on more plaforms ...
var driver = new webdriver.Builder().
	withCapabilities({
		'browserName': 'chrome',
		'platform': 'Windows 10',
		'version': '50.0',
		'username': USER_NAME,
		'accessKey': ACCESS_KEY,
		'name': NAME
	}).
	usingServer("http://" + USER_NAME + ":" + ACCESS_KEY + "@ondemand.saucelabs.com:80/wd/hub").
	build();

//TODO - Rewrite to use Mocha ...
var TITLE = 'Space';
driver.getSession().then(function (session) {
	var id = session.id_;
	var SauceLabs = require("saucelabs");
	var saucelabs = new SauceLabs({
		username: USER_NAME,
		password: ACCESS_KEY
	}); 
	driver.get(TEST_URL);
	console.log("Starting tests ...");
	driver.getTitle().then(function (title) {
		console.log("title is: " + title);
		var passed = title === TITLE;
		var done = function () {
			console.log("done: " + passed);
		};
		//console.log(id);
		driver.quit();
			saucelabs.updateJob(id, {
			name: title,
			passed: passed
		}, done);
	});
});


