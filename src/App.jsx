import { useState, useEffect, Fragment } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReactGA from "react-ga4";
import Home from './views/Home.jsx';
import GameCenter from './views/GameCenter.jsx';
import './App.css';


function App() {
  const googleID = import.meta.env.VITE_GA_ID;

  ReactGA.initialize(googleID);

  return (
    <>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gamecenter/:id" element={<GameCenter />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;
