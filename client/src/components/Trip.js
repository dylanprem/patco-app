import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Form, Row, Col, Container, Alert, Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';

function Trip() {
	const [ stops, setStops ] = useState([]);
	const [ filteredStops, setFilteredStops ] = useState([]);
	const [ fareRules, setFareRules ] = useState([]);
	const [ fareAttributes, setFareAttributes ] = useState([]);
	const [ routes, setRoutes ] = useState([]);
	const [ fromDestination, setFromDestination ] = useState({});
	const [ toDestination, setToDestination ] = useState({});
	const [ direction, setDirection ] = useState({});
	const [ fromCoords, setFromCoords ] = useState([ 39.833809, -75.000325 ]);
	const [ toCoords, setToCoords ] = useState([ 39.948635, -75.167792 ]);
	const [ fromMap, setFromMap ] = useState(null);
	const [ toMap, setToMap ] = useState(null);
	const [ nextTrains, setNextTrains ] = useState([]);
	const [ enableTo, setEnableTo ] = useState(false);
	const [ panels, setShowPanels ] = useState(false);
	const [ showSubmit, setShowSubmit ] = useState(false);
	const [ showReset, setShowReset ] = useState(false);

	useEffect(() => {
		let done = false;
		let stopsResponse;
		let fareAttributesResponse;
		let fareRulesResponse;
		let routesResponse;

		async function fetchData() {
			stopsResponse = await axios.get('http://localhost:5000/api/gtfs/stops');
			fareAttributesResponse = await axios.get('http://localhost:5000/api/gtfs/fare-attributes');
			fareRulesResponse = await axios.get('http://localhost:5000/api/gtfs/fare-rules');
			routesResponse = await axios.get('http://localhost:5000/api/gtfs/routes');

			// Update State
			if (stopsResponse) {
				setStops([ ...stopsResponse.data ].sort((a, b) => b.stop_id - a.stop_id));
				setFilteredStops([ ...stopsResponse.data ].sort((a, b) => b.stop_id - a.stop_id));
			}
			if (fareAttributesResponse) setFareAttributes(fareAttributesResponse.data);
			if (fareRulesResponse) setFareRules(fareRulesResponse.data);
			if (routesResponse) setRoutes(routesResponse.data);
		}

		fetchData();

		return () => {
			done = true;
		};
	}, []);

	useEffect(
		() => {
			let done = false;

			const resolveDirection = async () => {
				if (JSON.stringify(fromDestination) === '{}' || JSON.stringify(toDestination) === '{}') {
					return false;
				}

				if (parseFloat(fromDestination.stop_id) < parseFloat(toDestination.stop_id)) {
					setDirection(routes.filter((x) => x.route_id === '2')[0]);
					setStops([ ...stops ].sort((a, b) => a.stop_id - b.stop_id));
					setFilteredStops([ ...filteredStops ].sort((a, b) => a.stop_id - b.stop_id));
				} else {
					setDirection(routes.filter((x) => x.route_id === '1')[0]);
					setStops([ ...stops ].sort((a, b) => b.stop_id - a.stop_id));
					setFilteredStops([ ...filteredStops ].sort((a, b) => b.stop_id - a.stop_id));
				}

				const response = await axios.get(
					`http://localhost:5000/api/gtfs/stop-times/${direction.route_id}/${fromDestination.stop_id}`
				);

				setNextTrains(response.data);
			};

			resolveDirection();

			return () => {
				done = true;
			};
		},
		[ fromDestination, toDestination ]
	);

	const setDirectionAndStops = (item) => {
		setDirection(item);
		const clone = [ ...stops ];
		if (item.route_id === '1') {
			setStops([ ...clone ].sort((a, b) => b.stop_id - a.stop_id));
			setFilteredStops([ ...clone ].sort((a, b) => b.stop_id - a.stop_id));
		} else {
			setStops([ ...clone ].sort((a, b) => a.stop_id - b.stop_id));
			setFilteredStops([ ...clone ].sort((a, b) => a.stop_id - b.stop_id));
		}
	};

	// functions
	const onFromSelect = (e) => {
		if (![ ...stops ].some((x) => x.stop_name === e.target.value)) {
			setFromDestination({});
			return false;
		}

		let obj = [ ...stops ].filter((x) => x.stop_name === e.target.value)[0];
		setFromDestination(obj);

		let coords = [ parseFloat(obj.stop_lat), parseFloat(obj.stop_lon) ];
		setFromCoords(coords);

		//fromMap.setView(coords, 30);
		setEnableTo(true);
		filterToDropdown(e);
	};

	const onToSelect = (e) => {
		if (![ ...stops ].some((x) => x.stop_name === e.target.value)) {
			setToDestination({});
			return false;
		}

		let obj = [ ...stops ].filter((x) => x.stop_name === e.target.value)[0];
		setToDestination(obj);

		let coords = [ parseFloat(obj.stop_lat), parseFloat(obj.stop_lon) ];
		setToCoords(coords);

		//toMap.setView(coords, 30);
		setShowSubmit(true);
	};

	const filterToDropdown = (e) => {
		let filtered;
		const selectedIndex = [ ...filteredStops ].findIndex((x) => x.stop_name === e.target.value);
		filtered = [ ...filteredStops ].filter((item, index) => index > selectedIndex);

		if (direction.route_id === '1') {
			setFilteredStops([ ...filtered ].sort((a, b) => b.stop_id - a.stop_id));
		} else {
			setFilteredStops([ ...filtered ].sort((a, b) => a.stop_id - b.stop_id));
		}
	};

	const onSubmit = (e) => {
		setShowPanels(true);
		setShowReset(true);
	};

	const updateTimes = async () => {
		const response = await axios.get(
			`http://localhost:5000/api/gtfs/stop-times/${direction.route_id}/${fromDestination.stop_id}`
		);

		setNextTrains(response.data);
	};

	return (
		<Container className="mt-2">
			{showReset ? (
				<div>
					<Button>Reset</Button>
				</div>
			) : (
				<div>
					{' '}
					<Row>
						<Col md="4">
							{' '}
							<ButtonGroup aria-label="Basic example">
								{routes.map((item, index) => {
									return (
										<Button
											key={index}
											variant={item.route_id === direction.route_id ? 'success' : 'secondary'}
											onClick={(e) => setDirectionAndStops(item)}
										>
											{item.route_long_name}
										</Button>
									);
								})}
							</ButtonGroup>
						</Col>
					</Row>
					<Row className="mt-2">
						<Col md="4">
							{' '}
							<Form.Select
								onChange={(e) => onFromSelect(e)}
								disabled={JSON.stringify(direction) === '{}'}
							>
								<option value={''}>Select Departing Station</option>
								{stops.map((item, index) => {
									return (
										<option
											key={index}
											value={item.stop_name}
											disabled={item.stop_id === toDestination.stop_id}
										>
											{item.stop_name}
										</option>
									);
								})}
							</Form.Select>
						</Col>
					</Row>
					<Row className="mt-2">
						<Col md="4">
							{' '}
							<Form.Select
								onChange={(e) => onToSelect(e)}
								disabled={JSON.stringify(fromDestination) === '{}'}
							>
								<option value={''}>Select Arriving Station</option>
								{filteredStops.map((item, index) => {
									return (
										<option
											key={index}
											value={item.stop_name}
											disabled={item.stop_id === fromDestination.stop_id}
										>
											{item.stop_name}
										</option>
									);
								})}
							</Form.Select>
						</Col>
					</Row>
					{showSubmit ? (
						<div>
							{' '}
							<Row className="mt-2">
								<Col md="4">
									<Button onClick={(e) => onSubmit(e)}>Submit</Button>
								</Col>
							</Row>
						</div>
					) : null}
				</div>
			)}

			{panels ? (
				<div>
					<Row className="mt-3 h-100">
						<Col className="h-100">
							<h1>From:</h1>
							<p>{fromDestination.stop_name}</p>
							<MapContainer
								center={[ ...fromCoords ]}
								zoom={15}
								scrollWheelZoom={true}
								whenCreated={setFromMap}
							>
								<TileLayer
									attribution="&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
									url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								/>
								<Marker position={[ ...fromCoords ]}>
									<Popup>{fromDestination.stop_name} Station</Popup>
								</Marker>
							</MapContainer>
						</Col>
						<Col className="h-100">
							{' '}
							<h1>To:</h1>
							<p>{toDestination.stop_name}</p>
							<MapContainer
								center={[ ...toCoords ]}
								zoom={15}
								scrollWheelZoom={true}
								whenCreated={setToMap}
							>
								<TileLayer
									attribution="&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
									url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								/>
								<Marker position={[ ...toCoords ]}>
									<Popup>{toDestination.stop_name} Station</Popup>
								</Marker>
							</MapContainer>
						</Col>
					</Row>
					<Row className="mt-5">
						<Col>
							<h3>
								Next 5 Stop Times at {fromDestination.stop_name} Station{' '}
								<Button onClick={(e) => updateTimes()}>Refresh</Button>
							</h3>{' '}
							{nextTrains.map((item, index) => {
								return (
									<Alert variant={index === 0 ? 'success' : 'dark'} className="mt-1" key={index}>
										<Alert.Heading>
											{index === 0 ? (
												<div>
													<p>
														<Spinner animation="grow" variant="success" /> Next Train
														arrives at {item.arrival_time}
													</p>
												</div>
											) : (
												<p>Arrives at {item.arrival_time}</p>
											)}
										</Alert.Heading>
									</Alert>
								);
							})}
						</Col>
						<Col>
							<h3>Trip Details:</h3>
							<p>You are travelling {direction.route_long_name}</p>
							<p>One way fare: </p>
							<p>Round trip fare: </p>
						</Col>
					</Row>
				</div>
			) : null}
		</Container>
	);
}

export default Trip;
