import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Badge, Col, Container, Alert, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import moment from 'moment';

function TwitterFeed() {
	const [ tweets, setTweets ] = useState([]);

	useEffect(() => {
		let done = false;
		let tweetsResponse;

		const getTweets = async () => {
			tweetsResponse = await axios.get('/api/gtfs/tweets');
			if (tweetsResponse) setTweets([ ...tweetsResponse.data ]);
		};

		getTweets();

		return () => {
			done = true;
		};
	}, []);
	return (
		<Container className="h-100 bg-warning">
			<Row className="h-100 justify-content-center align-items-center">
				<Col md="8" className="text-center">
					{' '}
					<img
						src="https://logos-download.com/wp-content/uploads/2019/01/PATCO_Logo.png"
						className="img-fluid"
						style={{ height: '25vh' }}
					/>
					<h1>PLANNING APP</h1>
					<Col md="6" className="offset-md-3">
						<Link to="/trips" className="btn btn-dark">
							Plan a trip
						</Link>{' '}
						<Link to="/places" className="btn btn-dark">
							Things to do
						</Link>
					</Col>
					<Col md="6" className="mt-3 offset-md-3">
						{' '}
						<Alert variant="dark">
							This is a project using GTFS data from the PATCO website. This application may be used to
							get a general idea of train times and stop locations. Please always refer to the PATCO{' '}
							<a href="https://ridepatco.org" target="new">
								website
							</a>{' '}
							for the most up-to-date trip info.
						</Alert>
						<h3>Built with:</h3>
						<p>React | Node.js | Express | Leaflet API | Twitter API | Bing Locations API | Yelp API</p>
					</Col>
				</Col>
				<Col md="4" style={{ height: '100vh', overflowY: 'scroll' }}>
					{tweets.map((item, index) => {
						return (
							<Card key={index} className="mt-2">
								<Card.Header>
									<i className="fab fa-twitter text-info" />{' '}
									{moment(item.created_at).format('MM/DD/YYYY hh:mm a')}
								</Card.Header>
								<Card.Body>
									<Card.Title>
										{item.user.verified ? (
											<i className="fas fa-badge-check text-info" />
										) : null}{' '}
										{item.user.name} <small className="text-muted">@{item.user.screen_name}</small>
									</Card.Title>
									<Card.Text>
										<p>{JSON.parse(JSON.stringify(item.full_text))} </p>
										{item.entities.media && item.entities.media.length > 0 ? (
											item.entities.media.map((m, urlIndex) => {
												return <img key={urlIndex} src={m.media_url} className="img-fluid" />;
											})
										) : (
											false
										)}
									</Card.Text>
									{item.entities.hashtags && item.entities.hashtags.length > 0 ? (
										item.entities.hashtags.map((h, hIndex) => {
											return (
												<Badge key={hIndex} bg="info" className="pl-1">
													#{h.text}
												</Badge>
											);
										})
									) : (
										false
									)}
								</Card.Body>
							</Card>
						);
					})}
				</Col>
			</Row>
		</Container>
	);
}

export default TwitterFeed;
