import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import HomePage from "./components/HomePage";
import UserProfile from "./components/UserProfile";
import ContributeForm from "./components/ContributeForm";
import ContentUpdateForm from "./components/ContentUpdateForm";
import Content from "./components/Content";
import AllContents from "./components/AllContents";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Button,
  Container,
  Nav,
  Navbar,
  NavDropdown,
  NavLink,
} from "react-bootstrap";
import Chatroom from "./components/Chatroom";
import axios from "axios";
import ScrollToTop from "react-scroll-to-top";

function App() {
  const [content, setContent] = useState({});
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/users`,
        {
          params: { email: user.email },
        }
      );
      console.log(data);
      if (data) {
        setProfilePicUrl(data.profilePicUrl);
      }
    };

    if (user) {
      fetchUser();
    }
  }, [user]);

  const handleNavLinkClick = (path) => {
    if (!isAuthenticated) {
      loginWithRedirect();
    } else {
      navigate(path);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <ScrollToTop color="black" width="20" height="20" />

        <Navbar expand="lg" className="bg-body-tertiary">
          <Container fluid>
            <Navbar.Brand href="/">Hello World</Navbar.Brand>
            <Navbar.Toggle aria-controls="navbarScroll" />
            <Navbar.Collapse id="navbarScroll">
              <Nav
                className="me-auto my-2 my-lg-0"
                style={{ maxHeight: "100px" }}
                navbarScroll
              >
                <Nav.Link href="/">Home</Nav.Link>
                <Nav.Link onClick={() => handleNavLinkClick("/contents")}>
                  Learn
                </Nav.Link>
                <Nav.Link onClick={() => handleNavLinkClick("/contribute")}>
                  Contribute
                </Nav.Link>
                <Nav.Link onClick={() => handleNavLinkClick("/chatroom")}>
                  Chatroom
                </Nav.Link>

                {isAuthenticated ? (
                  <NavDropdown
                    title={
                      <div className="profile">
                        <img
                          src={
                            profilePicUrl ||
                            "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"
                          }
                          alt="profile"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    }
                    id="navbarScrollingDropdown"
                  >
                    <NavDropdown.Item>
                      {user.email}
                      <NavDropdown.Divider />

                      <Button
                        onClick={() => handleNavLinkClick("/users/update")}
                        variant="light"
                      >
                        Profile
                      </Button>

                      <NavDropdown.Divider />
                      <Button
                        onClick={() =>
                          logout({
                            logoutParams: {
                              returnTo: window.location.origin,
                            },
                          })
                        }
                        variant="light"
                      >
                        Log Out
                      </Button>
                    </NavDropdown.Item>
                  </NavDropdown>
                ) : (
                  <NavLink onClick={() => loginWithRedirect()}>Log In</NavLink>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Routes>
          <Route index element={<HomePage />} />

          <Route
            path="/users/update"
            element={<UserProfile setProfilePicUrl={setProfilePicUrl} />}
          />

          <Route path="/contents" element={<AllContents />} />

          <Route
            path="/contents/:contentId"
            element={<Content content={content} setContent={setContent} />}
          />

          <Route
            path="/contents/:contentId/update"
            element={
              <ContentUpdateForm content={content} setContent={setContent} />
            }
          />

          <Route path="/contribute" element={<ContributeForm />} />

          <Route path="/chatroom" element={<Chatroom />} />
        </Routes>
      </header>
    </div>
  );
}

export default App;
