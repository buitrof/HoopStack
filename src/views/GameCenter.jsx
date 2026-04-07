import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Container, Col, Row, Table, Tabs, Tab } from 'react-bootstrap';
import Highcharts from "highcharts";
import { Chart, Series, Tooltip, setHighcharts } from "@highcharts/react";
import "highcharts/modules/accessibility";
import "highcharts/modules/exporting";
import GameCard from '../components/GameCard.jsx';
import NavbarMain from '../components/Navbar.jsx';
import ModalMessage from '../components/ModalMessage.jsx';
import { teamColors } from '../utils/teamColors.js';
import Footer from '../components/Footer.jsx';

setHighcharts(Highcharts);

function GameCenter() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loadMessage, setLoadMessage] = useState("Loading data...");
  const [todayDate, setTodayDate] = useState('');
  const [visitorPoints, setVisitorPoints] = useState([]);
  const [homePoints, setHomePoints] = useState([]);
  const [chartLabels, setChartLabels] = useState('');
  const [chartOptions, setChartOptions] = useState({
    xAxis: { 
      categories: [], 
      tickmarkPlacement: 'on',
      title: { text: 'Period', style: { color: '#F8FAFC' } },
      startOnTick: true,
      labels: {
        formatter: function () {
          return this.value === "" ? "" : this.value;
        },
        style: {
          color: '#F8FAFC'
        }
      },
      gridLineColor: 'rgba(255, 255, 255, 0.1)'
    },
    yAxis: {
      min: 0,
      title: { text: 'Points', style: { color: '#F8FAFC' } },
      gridLineColor: 'rgba(255, 255, 255, 0.1)',
      labels: { style: { color: '#F8FAFC' } }
    },
    plotOptions: {
      series: {
        marker: {
          enabled: true
        }
      }
    },
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Roboto, sans-serif'
      }
    },
    legend: {
      itemStyle: {
        color: '#F8FAFC',
        fontWeight: 'bold'
      },
      itemHoverStyle: {
        color: '#CBD5E1'
      }
    },
    series: []
  });
  const chartRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (chartRef.current && chartRef.current.chart) {
        chartRef.current.chart.reflow();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, []);
  
  useEffect(() => {
    fetchGame();
  }, [id]);
  
  const apiKey = import.meta.env.VITE_BDL_API_KEY;
  const BASE_URL = import.meta.env.DEV
    ? '/espn-api'
    : 'https://site.web.api.espn.com';
  const statTypes = ['points', 'rebounds', 'assists'];
  
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

      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      const data = await response.json();

      if (response.status === 200) {
        setGame(data.data);

        await fetchGameData(data.data);
      }
    } catch (error) {
      console.log(error)
      if (error.message === 'RATE_LIMIT') {
        setLoadMessage("Whoa there! Too many requests. Please wait a minute and try again.");
      } else {
        setLoadMessage("Error getting data :(");
      }
    }
  };

  const fetchGameData = async (bdlGame) => {
    try {
      const date = bdlGame.date.split('T')[0].replaceAll('-', '');

      const scoreboardUrl = `${BASE_URL}/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}`;
      const response = await fetch(scoreboardUrl);
      const data = await response.json();

      const espnGame = data.events.find(event =>
        event.name.toLowerCase().includes(bdlGame.home_team.name.toLowerCase())
      );

      if (espnGame) {
        const espnId = espnGame.id;
        const summaryUrl = `${BASE_URL}/apis/site/v2/sports/basketball/nba/summary?event=${espnId}`;
        const summaryResponse = await fetch(summaryUrl);
        const summaryData = await summaryResponse.json();
        setGameData(summaryData);
      }
    } catch (error) {
      console.error("Failed to sync with ESPN:", error);
      setLoadMessage("Failed to sync with ESPN :(");
    }
  };

  useEffect(() => {
    if (!game) return;

    const currentActivePeriod = game.period;
    const allLabels = ["", "Q1", "Q2", "Q3", "Q4", "OT1", "OT2", "OT3"];

    const validOT = getRegulationScores("visitor") === getRegulationScores("home");

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

        if (periodIndex > 4 && !validOT) break;
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

    const currentLabels = allLabels.slice(0, visitorData.length);
    const hasOT = currentLabels.includes("OT1");

    setChartOptions(prevOptions => ({
      ...prevOptions,
      xAxis: {
        ...prevOptions.xAxis,
        categories: currentLabels,
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
            style: { color: '#F8FAFC' }
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
      },
    }));
  }, [game])

  const getRunningTotals = (teamPrefix) => {
    const periodKeys = ['q1', 'q2', 'q3', 'q4', 'ot1', 'ot2', 'ot3'];
    let runningTotal = 0;

    for (let i = 0; i < periodKeys.length; i++) {
      const periodIndex = i + 1;
      if (periodIndex > game.period) break;

      const periodScore = game[`${teamPrefix}_${periodKeys[i]}`] ?? 0;
      const scoreValue = periodScore !== null ? periodScore : 0;

      runningTotal += scoreValue;
    }
    return runningTotal;
  };

  const getRegulationScores = (teamPrefix) => {
    const periodKeys = ['q1', 'q2', 'q3', 'q4'];
    let runningTotal = 0;

    for (let i = 0; i < periodKeys.length; i++) {
      const periodScore = game[`${teamPrefix}_${periodKeys[i]}`] ?? 0;
      const scoreValue = periodScore !== null ? periodScore : 0;

      runningTotal += scoreValue;
    }
    return runningTotal;
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

  useEffect(() => {
    console.log(gameData);
  }, [gameData])

  const genericPage = 
    <>
      <NavbarMain onLinkClick={openModal} />

      <Container className="smaller-container">
        <div className="spacer"><h3>{loadMessage}</h3></div>
      </Container>
      <Footer />

      <ModalMessage show={showModal} handleClose={closeModal} />
    </>;

  if (!game || !gameData) return genericPage;

  return (
    <>
      <NavbarMain onLinkClick={openModal} />

      <Container className="main-container">
        {gameData &&
          <Row>
            <Col xs={12} className="mt-4">
              <h1>Game Center: {game.visitor_team.full_name} vs. {game.home_team.full_name}</h1>
            </Col>

            <Col xl={6} className="text-center">
              <Card className="mt-4 main-content-card no-min-height">
                <Card.Body>
                  <h4 className="text-left">Game Status & Score</h4>

                  <GameCard game={game} key={game.id} onDetailsClick={openModal} gameCenterLinkHide={true} />
                </Card.Body>
              </Card>

              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left">Player Stats</h4>

                  <Tabs
                    defaultActiveKey="awayTeam"
                    id="player-stats-tab"
                    className="hoop-tabs"
                    justify
                  >
                    <Tab eventKey="awayTeam" title={gameData.boxscore.teams[0].team.name}>
                      <Table bordered hover responsive variant="dark" className="hoops-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>Player</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TO</th>
                            <th>PF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gameData.boxscore.players[0].statistics[0].athletes.map(({ athlete, stats }, index) => {
                            const [min, pts, fgs, threeFG, fts, reb, ast, to, stl, blk, orbs, drbs, pf, plusMinus] = stats;

                            return (
                            <tr key={index}>
                              <th>{index + 1}</th>
                              <th className="text-left">{athlete.displayName}</th>
                              <th>{stats.length !== 0 ? min : '-'}</th>
                              <th>{stats.length !== 0 ? pts : '-'}</th>
                              <th>{stats.length !== 0 ? reb : '-'}</th>
                              <th>{stats.length !== 0 ? ast : '-'}</th>
                              <th>{stats.length !== 0 ? stl : '-'}</th>
                              <th>{stats.length !== 0 ? blk : '-'}</th>
                              <th>{stats.length !== 0 ? to : '-'}</th>
                              <th>{stats.length !== 0 ? pf : '-'}</th>
                            </tr>
                          )})}
                        </tbody>
                      </Table>
                    </Tab>
                    <Tab eventKey="homeTeam" title={gameData.boxscore.teams[1].team.name}>
                      <Table bordered hover responsive variant="dark" className="hoops-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>Player</th>
                            <th>MIN</th>
                            <th>PTS</th>
                            <th>REB</th>
                            <th>AST</th>
                            <th>STL</th>
                            <th>BLK</th>
                            <th>TO</th>
                            <th>PF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gameData.boxscore.players[1].statistics[0].athletes.map(({ athlete, stats }, index) => {
                            const [min, pts, fgs, threeFG, fts, reb, ast, to, stl, blk, orbs, drbs, pf, plusMinus] = stats;

                            return (
                              <tr key={index}>
                                <th>{index + 1}</th>
                                <th className="text-left">{athlete.displayName}</th>
                                <th>{stats.length !== 0 ? min : '-'}</th>
                                <th>{stats.length !== 0 ? pts : '-'}</th>
                                <th>{stats.length !== 0 ? reb : '-'}</th>
                                <th>{stats.length !== 0 ? ast : '-'}</th>
                                <th>{stats.length !== 0 ? stl : '-'}</th>
                                <th>{stats.length !== 0 ? blk : '-'}</th>
                                <th>{stats.length !== 0 ? to : '-'}</th>
                                <th>{stats.length !== 0 ? pf : '-'}</th>
                              </tr>
                            )
                          })}
                        </tbody>
                      </Table>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>

              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left">Team Leaders</h4>

                  <Table bordered hover responsive variant="dark" className="hoops-table">
                    <thead>
                      <tr>
                        <th>{gameData.boxscore.teams[0].team.name} Leader</th>
                        <th>Stat</th>
                        <th>{gameData.boxscore.teams[1].team.name} Leader</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statTypes.map((type) => {
                        const awayLeaders = gameData.leaders[0].leaders;
                        const homeLeaders = gameData.leaders[1].leaders;
                        const awayCat = awayLeaders.find(l => l.name === type);
                        const homeCat = homeLeaders.find(l => l.name === type);

                        const away = awayCat?.leaders[0];
                        const home = homeCat?.leaders[0];

                        return (
                          <tr key={type} className="border-b border-gray-800">
                            <td className="align-center text-left">
                              <div className="flex items-center gap-2">
                                <Row>
                                  <Col xs={9}>
                                    <p className="font-bold mb-0">{away.athlete.shortName}</p>
                                    <p>{away.summary}</p>
                                  </Col>
                                  <Col xs={3}>
                                    <h5 className="mt-2">{away.displayValue}</h5>
                                  </Col>
                                </Row>
                              </div>
                            </td>

                            <td className="align-center">
                              <p>{awayCat.displayName}</p>
                            </td>

                            <td className="align-center text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Row>
                                  <Col xs={3}>
                                    <h5 className="mt-2">{home.displayValue}</h5>
                                  </Col>
                                  <Col xs={9}>
                                    <p className="font-bold mb-0">{home.athlete.shortName}</p>
                                    <p>{home.summary}</p>
                                  </Col>
                                </Row>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={6} className="text-center">
              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left">Period Scores</h4>

                  <Table bordered hover responsive variant="dark" className="hoops-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Q1</th>
                        <th>Q2</th>
                        <th>Q3</th>
                        <th>Q4</th>
                        {game.visitor_ot1 !== null && (getRegulationScores("visitor") === getRegulationScores("home")) &&
                          <th>OT1</th>
                        }
                        {game.visitor_ot2 !== null &&
                          <th>OT2</th>
                        }
                        {game.visitor_ot3 !== null &&
                          <th>OT3</th>
                        }
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-left">{game.visitor_team.name}</td>
                        <td>{game.visitor_q1}</td>
                        <td>{game.period > 1 ? game.visitor_q2 : '-'}</td>
                        <td>{game.period > 2 ? game.visitor_q3 : '-'}</td>
                        <td>{game.period > 3 ? game.visitor_q4 : '-'}</td>
                        {game.visitor_ot1 !== null && (getRegulationScores("visitor") === getRegulationScores("home")) &&
                          <td>{game.visitor_ot1}</td>
                        }
                        {game.visitor_ot2 !== null &&
                          <td>{game.visitor_ot2}</td>
                        }
                        {game.visitor_ot3 !== null &&
                          <td>{game.visitor_ot3}</td>
                        }
                        <td>{getRunningTotals("visitor")}</td>
                      </tr>
                      <tr>
                        <td className="text-left">{game.home_team.name}</td>
                        <td>{game.home_q1}</td>
                        <td>{game.period > 1 ? game.home_q2 : '-'}</td>
                        <td>{game.period > 2 ? game.home_q3 : '-'}</td>
                        <td>{game.period > 3 ? game.home_q4 : '-'}</td>
                        {game.home_ot1 !== null && (getRegulationScores("visitor") === getRegulationScores("home")) &&
                          <td>{game.home_ot1}</td>
                        }
                        {game.home_ot2 !== null &&
                          <td>{game.home_ot2}</td>
                        }
                        {game.home_ot3 !== null &&
                          <td>{game.home_ot3}</td>
                        }
                        <td>{getRunningTotals("home")}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left mb-4">Points per Quarter Performance</h4>
                  
                  {game && visitorPoints.length > 0 && (
                    <Chart options={chartOptions} ref={chartRef}>
                      {[
                        { id: "visitor", name: game.visitor_team.name, data: visitorPoints },
                        { id: "home", name: game.home_team.name, data: homePoints },
                      ].map((series) => {
                        const colors = teamColors[series.name] || { primary: "#333", secondary: "#999" };
                        const chartPrimary = colors.primary === '#000000' ? '#444' : colors.primary;

                        return (
                        <Series
                          key={series.id}
                          type={series.type}
                          data={series.data}
                          type="line"
                          options={{
                            ...series.options,
                            id: series.id,
                            name: series.name,
                            color: colors.primary,
                            marker: {
                              fillColor: colors.secondary,
                              lineWidth: 2,
                              lineColor: colors.primary,
                              states: {
                                hover: {
                                  lineWidth: 3,
                                  lineColor: '#F8FAFC'
                                }
                              }
                            }
                          }}
                        />
                      )})}
                    </Chart>
                  )}
                </Card.Body>
              </Card>

              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left mb-4">Team Stats</h4>

                  <Table bordered hover responsive variant="dark" className="hoops-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>{gameData.boxscore.teams[0].team.name}</th>
                        <th>{gameData.boxscore.teams[1].team.name}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameData.boxscore.teams[0].statistics
                        .filter(stat => !['fieldGoalPct', 'threePointFieldGoalPct', 'freeThrowPct', 'defensiveRebounds', 'teamTurnovers', 'totalTurnovers', 'fouls', 'flagrantFouls', 'leadChanges', 'totalTechnicalFouls', 'technicalFouls'].includes(stat.name))
                        .map((stat) => {
                          const homeStat = gameData.boxscore.teams[1].statistics.find(s => s.name === stat.name);

                          const getPct = (teamIdx, statName) => {
                            const pctMap = {
                              'fieldGoalsMade-fieldGoalsAttempted': 'fieldGoalPct',
                              'threePointFieldGoalsMade-threePointFieldGoalsAttempted': 'threePointFieldGoalPct',
                              'freeThrowsMade-freeThrowsAttempted': 'freeThrowPct'
                            };
                            const pctName = pctMap[statName];
                            if (!pctName) return null;
                            return gameData.boxscore.teams[teamIdx].statistics.find(s => s.name === pctName)?.displayValue;
                          };

                          const awayPct = getPct(0, stat.name);
                          const homePct = getPct(1, stat.name);

                          return (
                            <tr key={stat.name}>
                              <td className="text-left" width="50%">{stat.label}</td>
                              <td width="25%">{stat.displayValue} {awayPct && `(${awayPct}%)`}</td>
                              <td width="25%">{homeStat?.displayValue || '-'} {homePct && `(${homePct}%)`}</td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                  </Table>
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