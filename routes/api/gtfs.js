const express = require('express');
const router = express.Router();
const cors = require('cors');
const fs = require('fs');
const Twitter = require('twitter');
const moment = require('moment');
const axios = require('axios');
const yelp = require('yelp-fusion');

// use
router.options('/*', cors());

// test
router.get('/test', (req, res) => {
	res.send('gtfs test route');
});

function getYelpInfo(obj, id) {}

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
router.get('/trips/:routeId', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/trips.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines
	const jsonFormat = csvToJSON(data);
	const filtered = [ ...jsonFormat ].filter((x) => x.route_id === req.params.routeId);

	res.json(filtered);
});

// Get next 5 arrival times based on stop
router.get('/stop-times/:routeId/:stopId', cors(), (req, res) => {
	const stopData = fs
		.readFileSync('PortAuthorityTransitCorporation/stop_times.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	const tripData = fs
		.readFileSync('PortAuthorityTransitCorporation/trips.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	// Stop times by station
	let stopDataJSON;
	let tripDataJSON;

	if (req.params.routeId === '2') {
		stopDataJSON = [ ...csvToJSON(stopData) ]
			.filter((x) => x.stop_id === req.params.stopId)
			.filter((y) => y.trip_id.length > 2)
			.sort((a, b) => parseFloat(a.trip_id) - parseFloat(b.trip_id));
		// All trips by route direction
		tripDataJSON = [ ...csvToJSON(tripData) ]
			.filter((x) => x.route_id === req.params.routeId)
			.filter((y) => y.trip_id.length > 2)
			.sort((a, b) => parseFloat(a.trip_id) - parseFloat(b.trip_id));
	} else {
		stopDataJSON = [ ...csvToJSON(stopData) ]
			.filter((x) => x.stop_id === req.params.stopId)
			.filter((y) => y.trip_id.length > 3)
			.sort((a, b) => parseFloat(a.trip_id) - parseFloat(b.trip_id));
		// All trips by route direction
		tripDataJSON = [ ...csvToJSON(tripData) ]
			.filter((x) => x.route_id === req.params.routeId)
			.filter((y) => y.trip_id.length > 3)
			.sort((a, b) => parseFloat(a.trip_id) - parseFloat(b.trip_id));
	}

	let objs = [];

	stopDataJSON.forEach((stop, stopIndex) => {
		tripDataJSON.forEach((trip, tripIndex) => {
			if (stop.trip_id.toString() === trip.trip_id.toString()) {
				const newObj = {
					route_id: trip.route_id,
					trip_id: stop.trip_id,
					stop_id: stop.stop_id,
					arrival_time: stop.arrival_time,
					wheelchair_accessible: trip.wheelchair_accessible,
					bikes_allowed: trip.bikes_allowed
				};

				objs.push(newObj);
			}
		});
	});

	const nextFiveTrains = objs
		.filter((x) => {
			const currentTime = moment();
			return moment(x.arrival_time, 'HH:mm:ss').isAfter(currentTime);
		})
		.filter((y, index) => index < 5);

	res.json(nextFiveTrains);
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
		count: 20,
		tweet_mode: 'extended'
	};

	client.get('statuses/user_timeline', params, function(error, tweets, response) {
		if (!error) {
			res.json(tweets);
		} else {
			res.json(error);
		}
	});
});

router.get('/local/:userLocation/:type', cors(), async (req, res) => {
	const key = process.env.BING_MAPS_KEY;
	const type = req.params.type;
	const userLocation = req.params.userLocation;
	const url = `https://dev.virtualearth.net/REST/v1/LocalSearch/?type=${type}&userLocation=${userLocation}&maxResults=25&key=${key}`;

	try {
		let response = await axios.get(url);
		res.json(response.data);
	} catch (error) {
		res.json(error);
	}
});

router.get('/yelp/business-match/:name/:address/:city/:state/:country', cors(), async (req, res) => {
	const client = yelp.client(process.env.YELP_API_KEY);
	const { name, address, city, state, country } = req.params;
	try {
		const response = await client.businessMatch({
			name: name,
			address1: address,
			city: city,
			state: state,
			country: country
		});

		return res.json(response.jsonBody.businesses[0].id);
	} catch (e) {
		console.log(e);
	}
});

router.get('/yelp/search/:id', cors(), async (req, res) => {
	const client = yelp.client(process.env.YELP_API_KEY);

	try {
		const response = await client.business(req.params.id);
		res.json(response.jsonBody);
	} catch (e) {
		console.log(e);
	}
});

router.get('/yelp/reviews/:id', cors(), async (req, res) => {
	const client = yelp.client(process.env.YELP_API_KEY);

	try {
		const response = await client.reviews(req.params.id);
		res.json(response.jsonBody);
	} catch (e) {
		console.log(e);
	}
});

module.exports = router;
