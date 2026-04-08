import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
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
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          align: "left",
          verticalAlign: "bottom",
        }
      }
    },
    accessibility: {
      enabled: true
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

  const isQuarterWinner = (awayScore, homeScore) => {
    if (awayScore === homeScore) return null;
    return awayScore > homeScore ? 'away' : 'home';
  };

  const formatDisplayDate = (dateString) => {
    return new Date(dateString + "T12:00:00").toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const series = useMemo(() => {
    if (!game || visitorPoints.length === 0 || homePoints.length === 0) {
      return [];
    }

    return [
      {
        id: "visitor",
        name: game.visitor_team.name,
        data: visitorPoints,
        color: teamColors[game.visitor_team.name]?.primary ?? "#333",
        marker: {
          fillColor: teamColors[game.visitor_team.name]?.secondary ?? "#999",
          lineWidth: 2,
          lineColor: teamColors[game.visitor_team.name]?.primary ?? "#333",
          states: {
            hover: {
              lineWidth: 3,
            }
          }
        }
      },
      {
        id: "home",
        name: game.home_team.name,
        data: homePoints,
        color: teamColors[game.home_team.name]?.primary ?? "#333",
        marker: {
          fillColor: teamColors[game.home_team.name]?.secondary ?? "#999",
          lineWidth: 2,
          lineColor: teamColors[game.home_team.name]?.primary ?? "#333",
          states: {
            hover: {
              lineWidth: 3,
            }
          }
        }
      }
    ];
  }, [game, visitorPoints, homePoints, teamColors]);

  const options = useMemo(() => ({
    ...chartOptions,
    series
  }), [chartOptions, series]);

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
    <main>
      {game && (
        <>
          <title>{`${game.visitor_team.name} @ ${game.home_team.name} - HoopStack`}</title>
          <meta name="description" content={`Live box scores and period-by-period scoring for ${game.visitor_team.full_name} vs ${game.home_team.full_name}.`} />
          <meta property="og:title" content={`${game.visitor_team.abbreviation} vs ${game.home_team.abbreviation} - Game Center`} />
        </>
      )}

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
                  <h4 className="text-left mb-4">Player Stats</h4>

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
                              <td>{index + 1}</td>
                              <td className="text-left">{athlete.displayName}</td>
                              <td>{stats.length !== 0 ? min : '-'}</td>
                              <td>{stats.length !== 0 ? pts : '-'}</td>
                              <td>{stats.length !== 0 ? reb : '-'}</td>
                              <td>{stats.length !== 0 ? ast : '-'}</td>
                              <td>{stats.length !== 0 ? stl : '-'}</td>
                              <td>{stats.length !== 0 ? blk : '-'}</td>
                              <td>{stats.length !== 0 ? to : '-'}</td>
                              <td>{stats.length !== 0 ? pf : '-'}</td>
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
                                <td>{index + 1}</td>
                                <td className="text-left">{athlete.displayName}</td>
                                <td>{stats.length !== 0 ? min : '-'}</td>
                                <td>{stats.length !== 0 ? pts : '-'}</td>
                                <td>{stats.length !== 0 ? reb : '-'}</td>
                                <td>{stats.length !== 0 ? ast : '-'}</td>
                                <td>{stats.length !== 0 ? stl : '-'}</td>
                                <td>{stats.length !== 0 ? blk : '-'}</td>
                                <td>{stats.length !== 0 ? to : '-'}</td>
                                <td>{stats.length !== 0 ? pf : '-'}</td>
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
                  <h4 className="text-left mb-4">Team Leaders</h4>

                  <Table bordered hover responsive variant="dark" className="hoops-table">
                    <thead>
                      <tr>
                        <th width="42%">{gameData.boxscore.teams[0].team.name} Leader</th>
                        <th width="16%">Stat</th>
                        <th width="42%">{gameData.boxscore.teams[1].team.name} Leader</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statTypes.map((type) => {
                        const awayLeaders = gameData.leaders[1].leaders;
                        const homeLeaders = gameData.leaders[0].leaders;
                        const awayCat = awayLeaders.find(l => l.name === type);
                        const homeCat = homeLeaders.find(l => l.name === type);

                        const away = awayCat?.leaders[0];
                        const home = homeCat?.leaders[0];

                        return (
                          <tr key={type}>
                            <td>
                              <div className="leader-cell leader-cell-away">
                                <div className="leader-info">
                                  <span className="font-bold">{away.athlete.shortName}</span><br />
                                  <span className="text-small">{away.summary}</span>
                                </div>

                                <div className="leader-stat">
                                  <h5 className="mb-0">{away.displayValue}</h5>
                                </div>
                              </div>
                            </td>

                            <td className="align-center">{awayCat.displayName}</td>

                            <td>
                              <div className="leader-cell leader-cell-home">
                                <div className="leader-stat">
                                  <h5 className="mb-0">{home.displayValue}</h5>
                                </div>

                                <div className="leader-info">
                                  <span className="font-bold">{home.athlete.shortName}</span><br />
                                  <span className="text-small">{home.summary}</span>
                                </div>
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
                  <h4 className="text-left mb-4">Period Scores</h4>

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
                        <td className={isQuarterWinner(game.visitor_q1, game.home_q1) === 'away' ? 'better-score-subtle' : ''}>
                          {game.visitor_q1}
                        </td>
                        <td className={isQuarterWinner(game.visitor_q2, game.home_q2) === 'away' ? 'better-score-subtle' : ''}>
                          {game.period > 1 ? game.visitor_q2 : '-'}
                        </td>
                        <td className={isQuarterWinner(game.visitor_q3, game.home_q3) === 'away' ? 'better-score-subtle' : ''}>
                          {game.period > 2 ? game.visitor_q3 : '-'}
                        </td>
                        <td className={isQuarterWinner(game.visitor_q4, game.home_q4) === 'away' ? 'better-score-subtle' : ''}>
                          {game.period > 3 ? game.visitor_q4 : '-'}
                        </td>
                        {game.visitor_ot1 !== null && (getRegulationScores("visitor") === getRegulationScores("home")) &&
                          <td className={isQuarterWinner(game.visitor_ot1, game.home_ot1) === 'away' ? 'better-score-subtle' : ''}>
                            {game.visitor_ot1}
                          </td>
                        }
                        {game.visitor_ot2 !== null &&
                          <td className={isQuarterWinner(game.visitor_ot2, game.home_ot2) === 'away' ? 'better-score-subtle' : ''}>
                            {game.visitor_ot2}
                          </td>
                        }
                        {game.visitor_ot3 !== null &&
                          <td className={isQuarterWinner(game.visitor_ot3, game.home_ot3) === 'away' ? 'better-score-subtle' : ''}>
                            {game.visitor_ot3}
                          </td>
                        }
                        <td className={getRunningTotals("visitor") > getRunningTotals("home") ? "better-score total" : ""}>{getRunningTotals("visitor")}</td>
                      </tr>
                      <tr>
                        <td className="text-left">{game.home_team.name}</td>
                        <td className={isQuarterWinner(game.visitor_q1, game.home_q1) === 'home' ? 'better-score-subtle' : ''}>
                          {game.home_q1}
                        </td>
                        <td className={isQuarterWinner(game.visitor_q2, game.home_q2) === 'home' ? 'better-score-subtle' : ''}>
                          {game.period > 1 ? game.home_q2 : '-'}
                        </td>
                        <td className={isQuarterWinner(game.visitor_q3, game.home_q3) === 'home' ? 'better-score-subtle' : ''}>
                          {game.period > 2 ? game.home_q3 : '-'}
                        </td>
                        <td className={isQuarterWinner(game.visitor_q4, game.home_q4) === 'home' ? 'better-score-subtle' : ''}>
                          {game.period > 3 ? game.home_q4 : '-'}
                        </td>
                        {game.home_ot1 !== null && (getRegulationScores("visitor") === getRegulationScores("home")) &&
                          <td className={isQuarterWinner(game.visitor_ot1, game.home_ot1) === 'home' ? 'better-score-subtle' : ''}>
                            {game.home_ot1}
                          </td>
                        }
                        {game.home_ot2 !== null &&
                          <td className={isQuarterWinner(game.visitor_ot2, game.home_ot2) === 'home' ? 'better-score-subtle' : ''}>
                            {game.home_ot2}
                          </td>
                        }
                        {game.home_ot3 !== null &&
                          <td className={isQuarterWinner(game.visitor_ot3, game.home_ot3) === 'home' ? 'better-score-subtle' : ''}>
                            {game.home_ot3}
                          </td>
                        }
                        <td className={getRunningTotals("home") > getRunningTotals("visitor") ? "better-score total" : ""}>{getRunningTotals("home")}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left mb-4">Points per Quarter Performance</h4>

                  {game && visitorPoints.length > 0 && (
                    <Chart options={options} ref={chartRef} />
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
                          const lowerIsBetter = ['turnovers', 'totalTurnovers', 'teamTurnovers', 'personalFouls', 'turnoverPoints'];

                          const isAwayBetter = () => {
                            const awayPct = parseFloat(getPct(0, stat.name));
                            const homePct = parseFloat(getPct(1, stat.name));

                            if (!isNaN(awayPct) && !isNaN(homePct)) {
                              if (awayPct > homePct) return true;
                              if (awayPct < homePct) return false;
                            }

                            const awayVal = parseFloat(stat.displayValue);
                            const homeVal = parseFloat(homeStat?.displayValue);

                            if (isNaN(awayVal) || isNaN(homeVal) || awayVal === homeVal) return false;

                            return lowerIsBetter.includes(stat.name) ? awayVal < homeVal : awayVal > homeVal;
                          };

                          const isHomeBetter = () => {
                            const awayPct = parseFloat(getPct(0, stat.name));
                            const homePct = parseFloat(getPct(1, stat.name));

                            if (!isNaN(awayPct) && !isNaN(homePct)) {
                              if (homePct > awayPct) return true;
                              if (homePct < awayPct) return false;
                            }

                            const awayVal = parseFloat(stat.displayValue);
                            const homeVal = parseFloat(homeStat?.displayValue);
                            
                            if (isNaN(awayVal) || isNaN(homeVal) || awayVal === homeVal) return false;

                            return lowerIsBetter.includes(stat.name) ? homeVal < awayVal : homeVal > awayVal;
                          };

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
                              <td width="25%" className={isAwayBetter() ? "better-score" : ""}>
                                {`${stat.displayValue}` + `${stat.name === 'leadPercentage' ? '%' : ''}`} {awayPct && `(${awayPct}%)`}
                              </td>
                              <td width="25%" className={isHomeBetter() ? "better-score" : ""}>
                                {`${homeStat?.displayValue}` + `${stat.name === 'leadPercentage' ? '%' : ''}` || '-'} {homePct && `(${homePct}%)`}
                              </td>
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
    </main>
  )
}

export default GameCenter;