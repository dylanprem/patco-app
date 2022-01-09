import React, { useState, useEffect } from 'react';
import { Row, Col, Container, Form, Button, Card, ListGroup, Modal, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Places() {
	const [ stops, setStops ] = useState([]);
	const [ places, setPlaces ] = useState([]);
	const [ userLocation, setUserLocation ] = useState({});
	const [ types, setTypes ] = useState([
		{ key: 'EatDrink', value: 'Bars & Restaurants' },
		{ key: 'SeeDo', value: 'Sightseeing' },
		{ key: 'Shop', value: 'Shopping' },
		{ key: 'BanksAndCreditUnions', value: 'Banks' },
		{ key: 'Hospitals', value: 'Hospitals' },
		{ key: 'HotelsAndMotels', value: 'Hotels and Motels' },
		{ key: 'Parking', value: 'Parking' }
	]);
	const [ selectedType, setSelectedType ] = useState('');
	const [ show, setShow ] = useState(false);
	const [ yelpInfo, setYelpInfo ] = useState({});
	const [ yelpReviews, setYelpReviews ] = useState([]);

	const handleClose = () => setShow(false);
	const handleShow = async (item) => {
		const name = item.name;
		const address = item.Address.addressLine;
		const city = item.Address.locality;
		const state = item.Address.adminDistrict;
		const country = item.Address.countryRegion;
		try {
			const yelpId = await axios.get(
				`/api/gtfs/yelp/business-match/${name}/${address}/${city}/${state}/${country}`
			);

			if (yelpId) {
				const businessResponse = await axios.get(`/api/gtfs/yelp/search/${yelpId.data}`);
				const reviews = await axios.get(`/api/gtfs/yelp/reviews/${yelpId.data}`);

				if (businessResponse) setYelpInfo(businessResponse.data);
				if (reviews) setYelpReviews(reviews.data);
			}
		} catch (error) {
			console.log(error);
		}

		setShow(true);
	};
	useEffect(() => {
		let done = false;
		let stopsResponse;

		async function fetchData() {
			stopsResponse = await axios.get('/api/gtfs/stops');

			// Update State
			if (stopsResponse)
				setStops(
					[ ...stopsResponse.data ]
						.filter((x) => parseFloat(x.stop_id) >= 10)
						.sort((a, b) => a.stop_id - b.stop_id)
				);
		}

		fetchData();

		return () => {
			done = true;
		};
	}, []);

	const search = async () => {
		setPlaces([]);
		const url = `/api/gtfs/local/${userLocation.stop_lat},${userLocation.stop_lon}/${selectedType}`;

		try {
			let response = await axios.get(url);
			setPlaces(response.data.resourceSets[0].resources);
		} catch (error) {
			console.log(error);
		}
	};

	const onSelect = (e) => {
		let obj = [ ...stops ].filter((x) => x.stop_name === e.target.value)[0];
		setUserLocation(obj);
	};

	const renderStars = (int) => {
		let arr = [];
		arr.length = int;

		arr.map((item) => {
			return <i className="fa fa-star" aria-hidden="true" />;
		});
	};

	return (
		<Container className="h-100">
			<Row className="m-2 p-2">
				<Link to="/">
					<i className="fa fa-home text-light" aria-hidden="true" />
				</Link>
			</Row>
			<Row className="mt-2">
				<h1 className="display-3 text-light text-center">Things to do in Philadelphia</h1>
				<Col md="4" className="offset-md-4">
					{' '}
					<Form.Select onChange={(e) => onSelect(e)}>
						<option value={''}>Select Philadelphia Station</option>
						{stops.map((item, index) => {
							return (
								<option key={index} value={item.stop_name}>
									{item.stop_name}
								</option>
							);
						})}
					</Form.Select>
				</Col>
			</Row>
			<Row className="mt-2">
				<Col md="4" className="offset-md-4">
					{' '}
					<Form.Select onChange={(e) => setSelectedType(e.target.value)}>
						<option value={''}>Select a Category</option>
						{types.map((item, index) => {
							return (
								<option key={index} value={item.key}>
									{item.value}
								</option>
							);
						})}
					</Form.Select>
					<Button
						onClick={(e) => search()}
						className="mt-2"
						variant="warning"
						disabled={JSON.stringify(userLocation === '{}') && selectedType === ''}
					>
						Search
					</Button>
				</Col>
			</Row>

			<Row>
				<Col md="6" className="offset-md-3">
					{places.map((item, index) => {
						return (
							<Card key={index} className="mt-3 mb-3">
								<Card.Body>
									<Card.Title>
										{item.name} <span className="text-muted">({item.entityType})</span>
									</Card.Title>
									<Card.Text>
										<Col className="h-100">
											<MapContainer
												center={item.point.coordinates}
												zoom={15}
												scrollWheelZoom={true}
											>
												<TileLayer
													attribution="&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
													url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
												/>
												<Marker position={item.point.coordinates}>
													<Popup>{item.name}</Popup>
												</Marker>
											</MapContainer>
										</Col>
										<ListGroup variant="flush">
											<ListGroup.Item>
												<i className="far fa-phone" /> {item.PhoneNumber}
											</ListGroup.Item>
											<ListGroup.Item>
												<i className="fad fa-map-marker-check" />{' '}
												{item.Address.formattedAddress}
											</ListGroup.Item>
										</ListGroup>
									</Card.Text>

									<ListGroup horizontal>
										<ListGroup.Item className="border-0">
											{' '}
											{item.Website != '' ? (
												<a
													href={item.Website}
													target="new"
													className="btn btn-primary text-light"
												>
													<i className="fas fa-globe" /> Website
												</a>
											) : null}
										</ListGroup.Item>
										<ListGroup.Item className="border-0">
											{' '}
											<Button
												variant="danger"
												className="text-light ml-1"
												onClick={(e) => handleShow(item)}
											>
												<i className="fab fa-yelp" /> Yelp info
											</Button>
										</ListGroup.Item>
									</ListGroup>
								</Card.Body>
							</Card>
						);
					})}
				</Col>
			</Row>
			<Modal show={show} onHide={handleClose} size="lg" centered>
				<Modal.Header closeButton>
					<Modal.Title>
						{yelpInfo.name} -{' '}
						{yelpInfo.is_closed ? (
							<span className="text-danger">Closed now</span>
						) : (
							<span className="text-secondary">
								Open now <i className="fa fa-check text-success" aria-hidden="true" />
							</span>
						)}
					</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<ListGroup variant="flush">
						<ListGroup.Item>
							<h3>
								Rating:{' '}
								<span
									className={
										parseFloat(yelpInfo.rating) <= 2 ? (
											'text-danger'
										) : parseFloat(yelpInfo.rating) >= 4 ? (
											'text-success'
										) : (
											'text-warning'
										)
									}
								>
									{yelpInfo.rating}/5
								</span>
							</h3>{' '}
							<Badge bg="dark">{yelpInfo.review_count} reviews</Badge>
						</ListGroup.Item>
						<ListGroup.Item>
							<h3>
								Price: <span className="text-success">{yelpInfo.price}</span>
							</h3>{' '}
						</ListGroup.Item>
						<ListGroup.Item>
							{yelpInfo.photos &&
								yelpInfo.photos.map((p, i) => {
									return (
										<img
											src={p}
											key={i}
											className="img-fluid rounded img-thumbnail"
											style={{ height: '33%', width: '33%' }}
										/>
									);
								})}
						</ListGroup.Item>
						<ListGroup.Item>
							<h3>Some Reviews:</h3>
							{yelpReviews.reviews &&
								yelpReviews.reviews.map((r, rIndex) => {
									return (
										<Card key={rIndex} className="mt-3 mb-3" bg="dark">
											<Card.Header>
												{[ ...Array(r.rating) ].map((num, numIndex) => {
													return (
														<i
															key={numIndex}
															className="fa fa-star text-warning"
															aria-hidden="true"
														/>
													);
												})}
											</Card.Header>
											<Card.Body>
												<blockquote className="blockquote mb-0">
													<p className="text-light">
														{r.text}{' '}
														<a href={r.url} target="new">
															read more
														</a>
													</p>

													<footer className="blockquote-footer">{r.user.name}</footer>
													<p className="text-light">
														Created at:{' '}
														<span className="text-secondary">{r.time_created}</span>
													</p>
												</blockquote>
											</Card.Body>
										</Card>
									);
								})}
						</ListGroup.Item>
					</ListGroup>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleClose}>
						Close
					</Button>
				</Modal.Footer>
			</Modal>
		</Container>
	);
}

export default Places;