import { useState, useEffect, Fragment } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './views/Home.jsx';
import GameCenter from './views/GameCenter.jsx';
import NavbarMain from './components/Navbar.jsx';
import ModalMessage from './components/ModalMessage.jsx';
import Footer from './components/Footer.jsx';
import './App.css';

function App() {

  return (
    <>
      <BrowserRouter basename="/HoopStack">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gamecenter/:id" element={<GameCenter />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
