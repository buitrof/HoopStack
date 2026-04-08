import { useState, useEffect, Fragment } from 'react';
import { Button, Card, Container, Col, Row } from 'react-bootstrap';
import GameCard from '../components/GameCard.jsx';
import NavbarMain from '../components/Navbar.jsx';
import ModalMessage from '../components/ModalMessage.jsx';
import Footer from '../components/Footer.jsx';

function Home() {
  const [loadMessage, setLoadMessage] = useState("Loading data...");
  const [initialLoad, setInitialLoad] = useState(true);
  const [todayDate, setTodayDate] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [games, setGames] = useState([]);
  const [showAllToday, setShowAllToday] = useState(false);
  const [showAllTomorrow, setShowAllTomorrow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  
  const MAX_GAMES = 5;
  
  const todayGames = games.filter(game => game.date === todayDate);
  
  const tomorrowGames = games
    .filter(game => game.date === tomorrow)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const displayedGamesTomorrow = showAllTomorrow ? tomorrowGames : tomorrowGames.slice(0, MAX_GAMES);

  const getStatusPriority = (status, period) => {
    if (status === "Final") return 2;
    if (period === 0) return 1;
    return 0;
  };
  
  const sortedGames = todayGames.sort((a, b) => {
    const priorityA = getStatusPriority(a.status, a.period);
    const priorityB = getStatusPriority(b.status, b.period);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return new Date(a.datetime) - new Date(b.datetime);
  });

  const displayedGamesToday = showAllToday ? sortedGames : sortedGames.slice(0, MAX_GAMES);

  const apiKey = import.meta.env.VITE_BDL_API_KEY;

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

  const fetchGamesToday = async () => {
    try {
      const url = `https://api.balldontlie.io/v1/games?start_date=${todayDate}`;
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
      setGames(data.data);
    } catch (error) {
      console.log(error)
      if (error.message === 'RATE_LIMIT') {
        setLoadMessage("Whoa there! Too many requests. Please wait a minute and try again.");
      } else {
        setLoadMessage("Error getting data :(");
      }
    }
  }

  useEffect(() => {
    if (initialLoad) {
      getGameDates();
      setInitialLoad(false)
    }
  }, [initialLoad])

  useEffect(() => {
    if (todayDate) {
      fetchGamesToday();
    }
  }, [todayDate])

  useEffect(() => {
    console.log(games);
  }, [games])

  return (
    <>
      <NavbarMain onLinkClick={openModal} />

      <Container className="main-container">
        {games.length > 0 ?
          <Row>
            <Col xs={12} className="mt-4">
              <h1>NBA Games</h1>
            </Col>

            <Col xl={6} className="text-center">
              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left mb-4">Today's Games <span className="subtitle">({formatDisplayDate(todayDate)})</span></h4>

                  {todayGames.length > 0 ?
                    <>
                      {displayedGamesToday.map((game) => (
                        <GameCard game={game} key={game.id} onDetailsClick={openModal} />
                      ))}
                    </>
                  :
                    <h5 className="mt-5">No games today :(</h5>
                  }

                  {todayGames.length > MAX_GAMES && (
                    <div className="text-center mt-3">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setShowAllToday(!showAllToday)}
                      >
                        {showAllToday ? "Show Less" : `View ${todayGames.length - MAX_GAMES} More Games`}
                      </button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col xl={6} className="text-center">
              <Card className="mt-4 main-content-card">
                <Card.Body>
                  <h4 className="text-left mb-4">Tomorrow's Games <span className="subtitle">({formatDisplayDate(tomorrow)})</span></h4>
                  {tomorrowGames.length > 0 ?
                    <>
                      {displayedGamesTomorrow.map((game) => (
                        <GameCard game={game} key={game.id} onDetailsClick={openModal} />
                      ))}
                    </>
                  :
                    <h5 className="mt-5">No games tomorrow :(</h5>
                  }

                  {tomorrowGames.length > MAX_GAMES && (
                    <div className="text-center mt-3">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setShowAllTomorrow(!showAllTomorrow)}
                      >
                        {showAllTomorrow ? "Show Less" : `View ${tomorrowGames.length - MAX_GAMES} More Games`}
                      </button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        :
          <Row>
            <Col sm={12} className="spacer">
              <h3>{loadMessage}</h3>
            </Col>
          </Row>
        }
      </Container>

      <Footer />

      <ModalMessage show={showModal} handleClose={closeModal} />
    </>
  )
}

export default Home;
