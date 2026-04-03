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
          <Col sm={4} className="align-center">
            <Row className="g-1">
              <Col sm={3}>
                <VisitorLogo size={45} />
              </Col>

              <Col className="text-left">
                <h5>{game.visitor_team.name}</h5>
              </Col>
            </Row>
          </Col>

          <Col sm={4}>
            {game.status === '1st Qtr' || game.status === '2nd Qtr' || game.status === '3rd Qtr' || game.status === '4th Qtr' || game.status === 'Final' ?
              <Row className="g-0">
                <Col sm={4}>
                  <div className="scorecard">
                    <p className={game.visitor_team_score > game.home_team_score ? "higher-score" : "lower-score"}>
                      {game.visitor_team.abbreviation}
                    </p>
                    <p className={game.visitor_team_score > game.home_team_score ? "higher-score" : "lower-score"}>
                      {game.visitor_team_score}
                    </p>
                    {game.status !== 'Final' &&
                      <p>TO: {game.visitor_timeouts_remaining}</p>
                    }
                  </div>
                </Col>

                <Col sm={4} className="align-center">
                  <h5>{game.time}</h5>
                </Col>

                <Col sm={4}>
                  <div className="scorecard">
                    <p className={game.visitor_team_score < game.home_team_score ? "higher-score" : "lower-score"}>
                      {game.home_team.abbreviation}
                    </p>
                    <p className={game.visitor_team_score < game.home_team_score ? "higher-score" : "lower-score"}>{game.home_team_score}</p>
                    {game.status !== 'Final' &&
                      <p>TO: {game.home_timeouts_remaining}</p>
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

          <Col sm={4} className="align-center">
            <Row className="g-1">
              <Col className="text-right">
                <h5>{game.home_team.name}</h5>
              </Col>

              <Col sm={3}>
                <HomeLogo size={45} />
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