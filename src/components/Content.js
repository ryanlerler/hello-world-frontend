import axios from "axios";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Form, ListGroup, Carousel } from "react-bootstrap";
import CommentUpdateForm from "./CommentUpdateForm";
import { useAuth0 } from "@auth0/auth0-react";
import ChatGpt from "./ChatGpt";
import { formatDistance, formatRelative, subDays } from "date-fns";
import Filter from "bad-words";
import { faArrowRight, faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const filter = new Filter();

export default function Content({ content, setContent }) {
  const { contentId } = useParams();
  const [likeCount, setLikeCount] = useState(0);
  const { user, getAccessTokenSilently } = useAuth0();
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [contentResponse, commentsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}`),
        axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/comments`
        ),
      ]);

      setContent(contentResponse.data);
      setComments(commentsResponse.data);
    };

    fetchData();
  }, [contentId, setContent]);

  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (user && user.email) {
        const { data } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/likeStatus`,
          {
            params: {
              email: user.email,
            },
          }
        );
        if (data) {
          setIsLiked(data.likeStatus);
        }
      }
    };

    fetchLikeStatus();
  }, [contentId, user]);

  useEffect(() => {
    const fetchLikeCount = async () => {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/likes`
      );
      if (data) {
        setLikeCount(data);
      }
    };

    fetchLikeCount();
  }, [contentId]);

  const handleLike = async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUDIENCE,
        scope: "read:current_user",
      },
    });

    await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/likes`,
      { email: user.email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setIsLiked(!isLiked);

    const updatedLikeCount = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/likes`
    );
    if (updatedLikeCount) {
      setLikeCount(updatedLikeCount.data);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();

    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUDIENCE,
        scope: "read:current_user",
      },
    });

    const sanitizedComment = filter.isProfane(commentInput)
      ? filter.clean(commentInput)
      : commentInput;

    const { data } = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/comments`,
      { text: sanitizedComment, email: user.email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setComments((prev) => [...prev, data]);
    setCommentInput("");
  };

  return (
    <div className="content-container">
      <div className="top-section">
        <div className="video-details ">
          {content && content.user && (
            <div>
              {content.videoUrl && content.photoUrl ? (
                <Carousel interval={null}>
                  <Carousel.Item>
                    <video
                      autoPlay
                      controls
                      key={content.videoUrl}
                      className="video"
                    >
                      <source src={content.videoUrl} />
                    </video>
                  </Carousel.Item>
                  <Carousel.Item>
                    <img
                      src={content.photoUrl}
                      alt="additional content"
                      className="content-pic"
                    />
                  </Carousel.Item>
                </Carousel>
              ) : (
                <video
                  autoPlay
                  controls
                  key={content.videoUrl}
                  className="video"
                >
                  <source src={content.videoUrl} />
                </video>
              )}

              {user && user.email === content.user.email && (
                <Link to={`/contents/${contentId}/update`}>
                  <FontAwesomeIcon icon={faEdit} />
                </Link>
              )}
              <br />

              <small>
                <img
                  src={content.user.profilePicUrl}
                  alt="profile"
                  className="comment-profile"
                />
                {content.user.nickname}
              </small>
              <p>
                <strong>{content.title}</strong>
              </p>
              <small>
                {formatRelative(
                  subDays(new Date(content.createdAt), 0),
                  new Date()
                )}
              </small>

              <br />

              <Button onClick={handleLike} variant="light">
                <div className="hearts">
                  {isLiked ? (
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Beating_Heart.gif"
                      alt="liked"
                      className="liked"
                    />
                  ) : (
                    <img
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQP7BtQGRHgjeqk3ubWK0IbBBNqXd5mdpmc1w&usqp=CAU"
                      alt="unliked"
                      className="unliked"
                    />
                  )}
                </div>
                <span>{likeCount}</span>
              </Button>
              <br />

              <div className="content-description">{content.description}</div>
              {content.externalReferenceUrl && (
                <a href={content.externalReferenceUrl}>External Link</a>
              )}
            </div>
          )}
        </div>

        <div className="chat-gpt">
          <ChatGpt />
        </div>
      </div>

      <div className="comments-section">
        <hr />
        <ListGroup>
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id}>
                <ListGroup.Item>
                  {comment.user && (
                    <div className="comment">
                      {comment.user.profilePicUrl && (
                        <img
                          src={comment.user.profilePicUrl}
                          alt="profile"
                          className="comment-profile"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      <small className="comment-nickname">
                        {comment.user.nickname || (user && user.nickname)} -{" "}
                        {comment.user.country || "Earth"} -{" "}
                        {formatDistance(
                          subDays(new Date(comment.createdAt), 0),
                          new Date(),
                          {
                            addSuffix: true,
                          }
                        )}
                      </small>
                    </div>
                  )}

                  {comment.text}

                  {user &&
                    user.email &&
                    comment.user &&
                    user.email === comment.user?.email && (
                      <CommentUpdateForm
                        comment={comment}
                        comments={comments}
                        setComments={setComments}
                      />
                    )}
                </ListGroup.Item>
              </div>
            ))
          ) : (
            <p>Be the first to comment</p>
          )}
        </ListGroup>
        <hr />

        <Form onSubmit={addComment}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Add a comment</Form.Label>
            <br />
            <Form.Control
              as="textarea"
              type="text"
              value={commentInput}
              placeholder="Enter comment"
              onChange={({ target }) => setCommentInput(target.value)}
              required
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="special-button">
            Submit <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </Form>
      </div>
    </div>
  );
}
