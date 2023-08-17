import { useAuth0 } from "@auth0/auth0-react";
import { Button, Carousel } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Home() {
  const [topLikedContents, setTopLikedContents] = useState([]);
  const { isLoading, user } = useAuth0();

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/contents/top5`
      );
      setTopLikedContents(data);
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div>
        <Button variant="primary" disabled>
          <Spinner as="span" animation="grow" size="sm" />
          Loading...
        </Button>
      </div>
    );
  }

  if (!isLoading && user) {
    axios.post(`${process.env.REACT_APP_BACKEND_URL}/users`, {
      email: user.email,
      nickname: user.nickname,
      profilePicUrl: user.picture,
    });
  }

  return (
    <div className="home-container">
      <div>
        <h1>Hello World - An edu-social app for ICT</h1>
        <img
          src="https://www.codelikethewind.org/content/images/2022/05/hello_world.png"
          alt="logo"
          className="logo"
        />
      </div>

      <div className="carousel-section">
        <h6>
          5 Most
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Beating_Heart.gif"
            alt="liked"
            className="liked"
          />
          Videos
        </h6>
        <Carousel>
          {topLikedContents.map((content) => (
            <Carousel.Item key={content.id}>
              <video controls src={content.videoUrl} />

              <Carousel.Caption>
                <h3>{content.title}</h3>
                <p>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Beating_Heart.gif"
                    alt="liked"
                    className="liked"
                  />
                  <small>{content.likeCount}</small>
                </p>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>
    </div>
  );
}
