import logo from './logo.svg';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Trip from './components/Trip';
import { Container, ListGroup } from 'react-bootstrap';

function App() {
	return (
		<Container className="App">
			<ListGroup horizontal>
				<ListGroup.Item>
					<Link to="/">Home</Link>
				</ListGroup.Item>
				<ListGroup.Item>
					<Link to="/trips">Trips</Link>
				</ListGroup.Item>
			</ListGroup>

			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="trips" element={<Trip />} />
			</Routes>
		</Container>
	);
}

export default App;
