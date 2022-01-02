import logo from './logo.svg';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Trip from './components/Trip';
import Places from './components/Places';
import { Container, ListGroup } from 'react-bootstrap';

function App() {
	return (
		<Container className="App">
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="trips" element={<Trip />} />
				<Route path="places" element={<Places />} />
			</Routes>
		</Container>
	);
}

export default App;
