import { Button, Card, Container, Col, Modal, Row } from 'react-bootstrap';

const ModalMessage = ({ title, message, show, handleClose }) => {
  return (
    <Modal show={show} onHide={handleClose} data-bs-theme="dark">
      <Modal.Header closeButton>
        <Modal.Title>Coming Soon</Modal.Title>
      </Modal.Header>
      <Modal.Body>More features coming soon!</Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
};

export default ModalMessage;