import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import logo from '../assets/HoopStack.png';

export default function NavbarMain({ onLinkClick }) {
  return (
    <Navbar expand="md" bg="dark" data-bs-theme="dark">
      <Container>
        <Navbar.Brand href="/">
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
            <Nav.Link href="/">Home</Nav.Link>
            <Nav.Link href="#" onClick={onLinkClick}>Scores</Nav.Link>
            <Nav.Link href="#" onClick={onLinkClick}>Standings</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}