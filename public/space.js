/*eslint-env browser */

var ROOT= location.protocol + "//" + location.host;
var GET_ASTROS = ROOT + "/astros";
var GET_TONE = ROOT + "/tone";
var CONTENTS_ID = "contents";
var TONES = ["Anger", "Fear", "Joy", "Sadness", "Analytical", "Confident", "Tentative"];

function main() {
	getAstros ();
}

function params(args) {
	if (!args) return "";
	return "?" + Object.keys(args || "").map(function(key) {
		return key + "="+  encodeURIComponent(args[key]);
	}).join("&");
}

function astroString(astro, percents) {
	var result = null;
	if (percents) {
		result = percents.map(function(x) {
			return x.tone_id + ":" + x.score.toFixed(0);}).join(", ");
	} else {
		result = ["0", "0", "0", "0", "0"];
	}
	var string = astro.name + " (" + astro.craft +")[" + result + "]";
	return string;
}

//TODO - refactor this function ... or maybe not ... how ugly is this code?
function getAstros(args) {
	var url = GET_ASTROS + params(args);
	var http = new XMLHttpRequest();
	http.open("GET", url);
	http.responseType = "json";
	http.onload = function() {
		if (http.status === 200) {
			var astros = http.response;
			var people = astros.people || [];
			var string = "";
			for (var i=0; i<people.length; i++) {
				string += "<div class='item'>";
				string +=
					"<div class='circle none' id='" + people[i].name + "-circle'></div>" +
					"<div class='text' id='" + people[i].name + "-text'>" + astroString(people[i]) + "</div>";
				string += "</div>";
			}
			var node = document.getElementById(CONTENTS_ID);
			if (node) node.innerHTML = string;
			for (var i=0; i<people.length; i++) {
				if (people[i].twitter) {
					var circle = document.getElementById(people[i].name +"-circle");
					if (circle) {
						circle.classList.remove("none");
						circle.classList.add("busy");
						getTone (people[i], function (astro, data) {
							var c = document.getElementById(astro.name + "-circle");
							if (c) c.classList.remove("busy");
							if (data) {
								var text = document.getElementById(astro.name + "-text");
								if (text) {
									try {
										var tones = data.result.document_tone.tones;
										var total = tones.reduce(function(p, n) {return p + n.score;}, 0);
										var percents = tones.map(function(x) {
											return {
												tone_id: x.tone_id,
												score: total === 0 ? 0 : x.score / total * 100
											};
										});
										var percent = percents.slice(0, percents.length / 2).reduce(function(p, n) {return p + Math.trunc(n.score)}, 0);
										console.log(percents.length + "  " + percent);
										text.innerHTML = astroString(astro, percents);
										if (percents.length !== 0) {
											c.style.background = "linear-gradient(to right, rgb(255,0,0) 0%, rgb(255,170,0) " + percent + "%, rgb(0,255,0) 100%)";
										} else {
											c.classList.add("none");
										}
									} catch (error) {
										c.classList.add("none");
									}
								} else {
									c.classList.add("none");
								}
							} else {
								c.classList.add("none");
							}
						});
					}
				}
			}
			return;
		}
		console.log(http.response);
	};
	http.onerror = function() {
		console.log(http.response);
	};
	http.send();
}

function getTone(astro, done) {
	var xhr = new XMLHttpRequest();
	var args = params({screen_name : astro.twitter});
	xhr.open("GET", GET_TONE + args);
	xhr.responseType = "json";
	xhr.onload = function() {
		if (xhr.status === 200) {
			if (done) done(astro, xhr.response);
			return;
		}
		console.log(xhr.response);
		if (done) done(astro);
	};
	xhr.onerror = function() {
		if (done) done(astro);
	};
	xhr.send();
}