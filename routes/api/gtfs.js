const express = require('express');
const router = express.Router();
const cors = require('cors');
const fs = require('fs');
const Twitter = require('twitter');

// use
router.options('/*', cors());

// test
router.get('/test', (req, res) => {
	res.send('gtfs test route');
});

function csvToJSON(data) {
	let strings = [];
	let objs = [];

	for (let i = 0; i <= data.length; i++) {
		if (data[i] !== undefined) {
			strings.push(data[i].trim());
		}
	}

	const keys = strings[0].toString().split(',');
	const values = strings.filter((array, index) => index !== 0);

	for (let i = 0; i <= values.length; i++) {
		let obj = {};

		if (values[i] !== undefined) {
			values[i].trim().split(',').forEach((item, index) => {
				obj[keys[index]] = item.trim();
			});

			objs.push(obj);
		}
	}

	objs.pop();

	return objs;
}

// Get Stop Times
router.get('/stop-times', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/stop_times.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	res.json(csvToJSON(data));
});

// Get Routes
router.get('/routes', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/routes.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	res.json(csvToJSON(data));
});

// Get Stops
router.get('/stops', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/stops.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	res.json(csvToJSON(data));
});

// Get fare attributes
router.get('/fare-attributes', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/fare_attributes.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	res.json(csvToJSON(data));
});

// Get fare rules
router.get('/fare-rules', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/fare_rules.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	res.json(csvToJSON(data));
});

// Get Trips
router.get('/trips', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/trips.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	res.json(csvToJSON(data));
});

// get twitter feed
router.get('/tweets', cors(), (req, res) => {
	const client = new Twitter({
		consumer_key: process.env.TWITTER_API_KEY,
		consumer_secret: process.env.TWITTER_API_SECRET,
		access_token_key: process.env.TWITTER_ACCESS_TOKEN,
		access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
	});

	const params = {
		screen_name: 'ridepatco',
		count: 20
	};

	client.get('statuses/user_timeline', params, function(error, tweets, response) {
		if (!error) {
			res.json(tweets);
		} else {
			res.json(error);
		}
	});
});

module.exports = router;
