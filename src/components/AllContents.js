import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Button, Form, Card, Row, Col, Container } from "react-bootstrap";

export default function AllContents() {
  const [contents, setContents] = useState([]);
  const [userTitleInput, setUserTitleInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [options, setOptions] = useState([]);
  const categories = [
    "Frontend Development",
    "Backend Development",
    "Mobile App Development",
    "Game Development",
    "Cybersecurity",
    "Artificial Intelligence and Machine Learning",
    "Cloud Computing and DevOps",
    "Internet of Things (IoT)",
    "Big Data and Data Science",
    "UI/UX Design",
    "Digital Marketing and E-commerce",
    "IT Certifications",
    "Algorithms and Data Structures",
  ];
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const title = searchParams.get("title");
  const sort = searchParams.get("sort");

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/categories`
      );
      setOptions(
        data.map((option) => ({ value: option.id, label: option.name }))
      );
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/contents`,
        {
          params: { title: title, sort: sort },
        }
      );
      setContents(data);
    };

    fetchData();
  }, [title, sort]);

  const handleSearchByTitle = (e) => {
    e.preventDefault();
    setSearchParams({ title: userTitleInput.toLowerCase() });
    setUserTitleInput("");
  };

  const handleCategoryClick = async (category, categoryId) => {
    setActiveCategory(category);
    setSearchParams({ categoryId: categoryId });

    const { data } = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/contents/category/${categoryId}`,
      { params: { categoryId: categoryId } }
    );
    setContents(data);
  };

  return (
    <div>
      <Form onSubmit={handleSearchByTitle}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Control
            type="text"
            value={userTitleInput}
            onChange={({ target }) => setUserTitleInput(target.value)}
            placeholder="Search by title"
          />
        </Form.Group>
      </Form>

      <Button
        onClick={() =>
          setSearchParams({ title: title === null ? "" : title, sort: "asc" })
        }
        className="special-button"
      >
        Older
      </Button>
      <Button
        onClick={() =>
          setSearchParams({ title: title === null ? "" : title, sort: "desc" })
        }
        className="special-button"
      >
        Recent
      </Button>
      <br />
      <br />

      <Container>
        <div className="category-container">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`category ${
                activeCategory === category ? "active" : ""
              }`}
              onClick={() => handleCategoryClick(category, index + 1)}
            >
              {category}
            </div>
          ))}
        </div>
        <div className="footer-container"></div>
      </Container>

      <Row xs={1} md={3} className="g-4">
        {contents.map((content) => (
          <Col key={content.id}>
            <Card className="card">
              <Link to={`/contents/${content.id}`}>
                <div className="videos-container">
                  <video className="videos">
                    <source src={content.videoUrl} />
                  </video>
                  <div className="play-icon-overlay">
                    <i className="fas fa-play"></i>
                  </div>
                </div>
              </Link>
              <Card.Body className="card-body">
                <Card.Title>{content.title}</Card.Title>
                <Card.Footer>
                  <small className="text-muted">
                    {content.user && content.user.nickname}
                  </small>
                </Card.Footer>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
