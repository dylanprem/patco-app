const express = require('express');
const router = express.Router();
const GtfsRealtimeBindings = require('gtfs-realtime-bindings');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const { type } = require('os');

// use
router.options('/*', cors());

// test
router.get('/test', (req, res) => {
	res.send('gtfs test route');
});

// Get Agencies
router.get('/agencies', cors(), (req, res) => {
	var data = fs
		.readFileSync('PortAuthorityTransitCorporation/stop_times.txt')
		.toString() // convert Buffer to string
		.split('\n'); // split string to lines

	let stopTimesArray = [];
	let objs = [];

	for (let i = 0; i <= data.length; i++) {
		if (data[i] !== undefined) {
			stopTimesArray.push(data[i].split());
		}
	}

	const keys = stopTimesArray[0].toString().split(',');
	const values = stopTimesArray.filter((array, index) => index !== 0);
	values.forEach((item) => {
		const arrayValues = item.toString().split(',');
		console.log(arrayValues);
		// let temp = {};

		// keys.forEach((key, index) => {
		// 	arrayValues.forEach((x) => {
		// 		Object.assign(temp, { [key]: x[index] });
		// 		objs.push(temp);
		// 	});
		// });
	});
	// values.forEach((arr) => {
	// 	arr.toString().split(',').forEach((set) => {
	// 		let obj = {};

	// 		keys.forEach((item, index) => {
	// 			Object.assign(obj, { [item]: set[index] });
	// 		});

	// 		objs.push(obj);
	// 	});
	// });

	//console.log(objs);
});

module.exports = router;
