import { Link } from 'react-router-dom';
import { Button, Card, Container, Col, Row } from 'react-bootstrap';
import * as NBAIcons from 'react-nba-logos';

const GameCard = ({ game, onDetailsClick, gameCenterLinkHide }) => {
  const HomeLogo = NBAIcons[game.home_team.abbreviation];
  const VisitorLogo = NBAIcons[game.visitor_team.abbreviation];

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

  const formatGameTime = (utcString) => {
    if (!utcString || !utcString.includes('T')) return utcString;

    return new Date(utcString).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatGameStatus = (status) => {
    if (!status) return { period: "", formattedTime: "" };

    if (!status.includes(' ')) {
      return { period: status, formattedTime: "" };
    }

    const [period, time] = status.split(' ');
    const formattedTime = time.startsWith(':') ? time.substring(1) : time;

    return { period, formattedTime };
  };

  const { period, formattedTime } = formatGameStatus(game.time);

  return (
    <Card className={game.period > 0 && game.status !== 'Final' ? "game-card live-game mt-3" : "game-card mt-3"}>
      <Card.Body>
        {game.period > 0 && game.status !== 'Final' ?
          <div className="indicator indicator-live">LIVE</div>
        : game.status === 'Final' ?
          <div className="indicator indicator-final">FINAL</div>
        :
          <>
            <div className="start-time">{formatGameTime(game.status)}</div>
            <div className="indicator indicator-upcoming">UPCOMING</div>
          </>
        }

        <Card.Title>{game.visitor_team.name} vs. {game.home_team.name}</Card.Title>

        <Row className="mt-4 g-0">
          <Col xl={3} lg={2} md={3} className="">
            <Row>
              <Col md={12} xs={4} className="visitor-logo">
                <VisitorLogo size={75} />
                <br className="mobile-show" />
                <h5 className="mobile-show">{game.visitor_team.name}</h5>
              </Col>

              <Col xs={12} className="mobile-hide">
                <h5>{game.visitor_team.name}</h5>
              </Col>

              {game.period === 0 &&
                <Col xs={4} className="mobile-show">
                  <div className="no-scorecard align-center">
                    <h5>vs.</h5>
                  </div>
                </Col>
              }

              <Col xs={game.period === 0 ? 4 : { span: 4, offset: 4 }} className="mobile-show">
                <HomeLogo size={75} />
                <br />
                <h5>{game.home_team.name}</h5>
              </Col>
            </Row>
          </Col>

          <Col xl={6} lg={8} md={6} className="score-row">
            {game.period > 0 ?
              <Row className="g-0">
                <Col xs={4}>
                  <div className="scorecard">
                    <p className={game.visitor_team_score > game.home_team_score ? "higher-score" : "lower-score"}>
                      {game.visitor_team.abbreviation}
                    </p>
                    <p className={game.visitor_team_score > game.home_team_score ? "higher-score" : "lower-score"}>
                      {game.visitor_team_score}
                    </p>
                    {game.status !== 'Final' &&
                      <div>
                        {[...Array(7)].map((timeouts, index) => {
                          const isActive = index < game.visitor_timeouts_remaining;
                          
                          return (
                            <div
                              key={index}
                              className={`timeout-bar ${isActive ? 'active' : 'spent'}`}
                            />
                          );
                        })}
                      </div>
                    }
                  </div>
                </Col>

                <Col xs={4} className="align-center">
                  <h5>
                    <span>{period}</span>
                    <br />
                    {game.status !== 'Final' && (
                      <span className={`fw-bold ${formattedTime.includes('.') ? 'text-danger' : ''}`}>{formattedTime}</span>
                    )}

                    {game.status === 'Final' && game.home_ot1 !== null && (getRegulationScores("visitor") === getRegulationScores("home")) && (
                      <span>OT</span>
                    )}
                  </h5>
                </Col>

                <Col xs={4}>
                  <div className="scorecard">
                    <p className={game.visitor_team_score < game.home_team_score ? "higher-score" : "lower-score"}>
                      {game.home_team.abbreviation}
                    </p>
                    <p className={game.visitor_team_score < game.home_team_score ? "higher-score" : "lower-score"}>{game.home_team_score}</p>
                    {game.status !== 'Final' &&
                      <div>
                        {[...Array(7)].map((timeouts, index) => {
                          const isActive = index < game.home_timeouts_remaining;
                          
                          return (
                            <div
                              key={index}
                              className={`timeout-bar ${isActive ? 'active' : 'spent'}`}
                            />
                          );
                        })}
                      </div>
                    }
                  </div>
                </Col>
              </Row>
              :
              <div className="no-scorecard mobile-hide">
                <h5>vs.</h5>
              </div>
            }
          </Col>

          <Col xl={3} lg={2} md={3} className="">
            <Row className="mobile-hide">
              <Col md={{ span: 12, offset: 0}} xs={{ span: 4, offset: 8}} className="home-logo">
                <HomeLogo size={75} />
              </Col>

              <Col xs={12}>
                <h5 className="team-name">{game.home_team.name}</h5>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card.Body>
      {!gameCenterLinkHide &&
        <Card.Footer>
          {game.period > 0 ?
            <Link
              to={`/gamecenter/${game.id}`}
              className="btn btn-primary w-100"
            >
              View Game Center
            </Link>
          :
            <Button
              variant="primary"
              className="w-100 disabled"
              onClick={onDetailsClick}
            >
              View Game Center
            </Button>
          }
        </Card.Footer>
      }
    </Card>
  )
};

export default GameCard;