import { Link } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import logo from '../assets/HoopStack.png';

export default function NavbarMain({ onLinkClick }) {
  return (
    <Navbar expand="md" bg="dark" data-bs-theme="dark">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src={logo}
            width="50"
            height="50"
            className="d-inline-block"
            alt="HoopStack logo"
          />
          Hoop<span className="logo-color">Stack</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" event-key="/">Home</Nav.Link>
            <Nav.Link href="#" onClick={onLinkClick}>Scores</Nav.Link>
            <Nav.Link href="#" onClick={onLinkClick}>Standings</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}