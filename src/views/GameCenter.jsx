import { useState, useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Container, Col, Row } from 'react-bootstrap';
import { Chart, Series, Tooltip } from "@highcharts/react";
import Highcharts from "highcharts/highcharts";
import "highcharts/modules/exporting";
import "highcharts/modules/accessibility";
import GameCard from '../components/GameCard.jsx';
import NavbarMain from '../components/Navbar.jsx';
import ModalMessage from '../components/ModalMessage.jsx';
import { teamColors } from '../utils/teamColors.js';
import Footer from '../components/Footer.jsx';

function GameCenter() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loadMessage, setLoadMessage] = useState("Loading data...");
  const [todayDate, setTodayDate] = useState('');
  const [visitorPoints, setVisitorPoints] = useState([]);
  const [homePoints, setHomePoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  
  useEffect(() => {
    fetchGame();
  }, [id]);
  
  const apiKey = import.meta.env.VITE_BDL_API_KEY;
  
  const fetchGame = async () => {
    try {
      const url = `https://api.balldontlie.io/v1/games/${id}`;
      const response = await fetch(url,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': apiKey
          },
        }
      );
      
      const data = await response.json();
      setGame(data.data);
    } catch (error) {
      console.log(error)
      setLoadMessage("Error getting data :(");
    }
  };

  useEffect(() => {
    if (game) {
      const visitor_q1 = game.visitor_q1;
      const visitor_q2 = game.visitor_q2 + visitor_q1;
      const visitor_q3 = game.visitor_q3 + visitor_q2;
      const visitor_q4 = game.visitor_q4 + visitor_q3;

      setVisitorPoints([visitor_q1, visitor_q2, visitor_q3, visitor_q4]);

      const home_q1 = game.home_q1;
      const home_q2 = game.home_q2 + home_q1;
      const home_q3 = game.home_q3 + home_q2;
      const home_q4 = game.home_q4 + home_q3;

      setHomePoints([home_q1, home_q2, home_q3, home_q4]);
    }
  }, [game])

  const chartOptions = {
    xAxis: {
      categories: ['1', '2', '3', '4'],
      title: {
        text: 'Quarter'
      }
    },
    yAxis: {
      title: {
        text: 'Points'
      },
      min: 0
    },
  };

  const getGameDates = () => {
    const date = new Date();

    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setTodayDate(formatDate(date));
    setTomorrow(formatDate(tomorrow));
  };

  const formatDisplayDate = (dateString) => {
    return new Date(dateString + "T12:00:00").toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    console.log(game);
  }, [game])

  if (!game) return <div className="spacer">{loadMessage}</div>;

  const seriesCatalog = [
    { id: "visitor", name: game.visitor_team.name, type: "line", data: visitorPoints },
    { id: "home", name: game.home_team.name, type: "line", data: homePoints },
  ];

  return (
    <>
      <NavbarMain onLinkClick={openModal} />

      <Container className="main-container">
        {game &&
          <Row>
            <Col xs={12} className="mt-4">
              <h1>Game Center: {game.visitor_team.full_name} vs. {game.home_team.full_name}</h1>
            </Col>

            <Col xl={6} className="text-center">
              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left">Game Status & Score</h4>

                  <GameCard game={game} key={game.id} onDetailsClick={openModal} gameCenterLinkHide={true} />
                </Card.Body>
              </Card>
            </Col>

            <Col xl={6} className="text-center">
              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left">Period Scores</h4>

                  <Chart options={chartOptions}>
                    {seriesCatalog.map((series) => {
                      const colors = teamColors[series.name] || { primary: "#333", secondary: "#999" };

                      return (
                      <Series
                        key={series.id}
                        type={series.type}
                        data={series.data}
                        options={{
                          ...series.options,
                          id: series.id,
                          name: series.name,
                          color: colors.primary,
                          marker: {
                            fillColor: colors.secondary,
                            lineWidth: 2,
                            lineColor: colors.primary
                          }
                        }}
                      />
                    )})}
                  </Chart>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        }
      </Container>

      <Footer />

      <ModalMessage show={showModal} handleClose={closeModal} />
    </>
  )
}

export default GameCenter;