const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// routes
const GTFS_ROUTES = require('./routes/api/gtfs');

// use
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/gtfs', GTFS_ROUTES);

//Server static assets if in production
if (process.env.NODE_ENV === 'production') {
	// Set static folder
	app.use(express.static('client/build'));

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
	});
}

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
