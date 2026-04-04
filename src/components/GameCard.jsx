import { Button, Card, Container, Col, Row } from 'react-bootstrap';
import * as NBAIcons from 'react-nba-logos';

const GameCard = ({ game, onDetailsClick }) => {
  const HomeLogo = NBAIcons[game.home_team.abbreviation];
  const VisitorLogo = NBAIcons[game.visitor_team.abbreviation];

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
    <Card className={game.status === '1st Qtr' || game.status === '2nd Qtr' || game.status === '3rd Qtr' || game.status === '4th Qtr' ? "game-card live-game mt-3" : "game-card mt-3"}>
      <Card.Body>
        {game.status === '1st Qtr' || game.status === '2nd Qtr' || game.status === '3rd Qtr' || game.status === '4th Qtr' ?
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
          <Col xl={3} lg={2} md={3} className="align-center">
            <Row>
              <Col md={12} xs={4} className="visitor-logo">
                <VisitorLogo size={75} />
              </Col>

              <Col xs={12}>
                <h5 className="team-name">{game.visitor_team.name}</h5>
              </Col>
            </Row>
          </Col>

          <Col xl={6} lg={8} md={6} className="score-row">
            {game.status === '1st Qtr' || game.status === '2nd Qtr' || game.status === '3rd Qtr' || game.status === '4th Qtr' || game.status === 'Final' ?
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
                  {game.status !== 'Final' &&
                    <span className={`fw-bold ${formattedTime.includes('.') ? 'text-danger' : ''}`}>{formattedTime}</span>
                  }
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
              <div className="no-scorecard">
                <h5>vs.</h5>
              </div>
            }
          </Col>

          <Col xl={3} lg={2} md={3} className="align-center">
            <Row>
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
      <Card.Footer>
        <Button 
          variant="primary" 
          className={game.status === '1st Qtr' || game.status === '2nd Qtr' || game.status === '3rd Qtr' || game.status === '4th Qtr' || game.status === 'Final' ? "w-100" : "w-100 disabled"}
          onClick={onDetailsClick}
        >
          View Game Center
        </Button>
      </Card.Footer>
    </Card>
  )
};

export default GameCard;