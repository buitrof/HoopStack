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
  const [chartLabels, setChartLabels] = useState('');
  const [chartOptions, setChartOptions] = useState({
    xAxis: { 
      categories: [], 
      tickmarkPlacement: 'on',
      title: { text: 'Period' },
      startOnTick: true,
      labels: {
        formatter: function () {
          return this.value === "" ? "" : this.value;
        }
      }
    },
    yAxis: {
      min: 0,
      title: { text: 'Points' }
    },
    plotOptions: {
      series: {
        marker: {
          enabled: true
        }
      }
    },
    series: []
  });
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
    if (!game) return;

    const currentActivePeriod = game.period;
    const allLabels = ["", "Q1", "Q2", "Q3", "Q4", "OT1", "OT2", "OT3"];

    const getCumulativeScores = (teamPrefix) => {
      const periodKeys = ['q1', 'q2', 'q3', 'q4', 'ot1', 'ot2', 'ot3'];
      const scores = [{
        x: 0,
        y: 0,
        marker: {
          enabled: false,
          states: {
            hover: { enabled: false }
          }
        }, 
        periodScore: 0,
        label: allLabels
      }];
      let runningTotal = 0;

      for (let i = 0; i < periodKeys.length; i++) {
        const periodIndex = i + 1;
        if (periodIndex > currentActivePeriod) break;

        const periodScore = game[`${teamPrefix}_${periodKeys[i]}`] ?? 0;
        const scoreValue = periodScore !== null ? periodScore : 0;

        runningTotal += scoreValue;
        scores.push({ x: i + 1, y: runningTotal, periodScore: scoreValue, periodLabel: allLabels[i + 1] });
      }
      return scores;
    };

    const visitorData = getCumulativeScores('visitor');
    const homeData = getCumulativeScores('home');

    setVisitorPoints(visitorData);
    setHomePoints(homeData);

    setChartLabels(allLabels.slice(0, visitorData.length));

    const hasOT = chartLabels.includes("OT1");

    setChartOptions({
      xAxis: {
        categories: chartLabels,
        tickmarkPlacement: 'on',
        min: 0,
        plotLines: hasOT ? [{
          color: '#FF0000',
          width: 2,
          value: 4,
          dashStyle: 'Dash',
          zIndex: 5,
        }] : [],
        plotBands: hasOT ? [{
          from: 4,
          to: 10,
          color: 'rgba(200, 200, 200, 0.1)',
          label: {
            text: 'Overtime',
            align: 'center',
            style: { color: '#999' }
          }
        }] : []
      },
      tooltip: {
        shared: true,
        useHTML: true,
        formatter: function () {
          if (this.x === 0) return false;

          const periodLabel = this.points[0].point.periodLabel;
          let s = `<b>${periodLabel}</b><br/>`;

          this.points.forEach(point => {
            s += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: 
              <b>${point.y}</b> <span style="font-size: 0.8em; color: #666;">
              (+${point.point.periodScore})</span><br/>`;
          });

          return s;
        }
      }
    });
  }, [game])

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

                  <Chart options={chartOptions} oneToOne={true}>
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