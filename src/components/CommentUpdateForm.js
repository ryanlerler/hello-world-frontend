import axios from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { useAuth0 } from "@auth0/auth0-react";
import Filter from "bad-words";
import {
  faCheck,
  faEdit,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const filter = new Filter();

export default function CommentUpdateForm({ comment, setComments }) {
  const [editMode, setEditMode] = useState(false);
  const [updatedComment, setUpdatedComment] = useState({});
  const { contentId } = useParams();
  const { getAccessTokenSilently } = useAuth0();

  const handleUpdateComment = async (commentId) => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUDIENCE,
        scope: "read:current_user",
      },
    });

    const sanitizedComment = filter.isProfane(updatedComment.text)
      ? filter.clean(updatedComment.text)
      : updatedComment.text;

    const { data } = await axios.put(
      `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/comments/${commentId}`,
      {
        text: sanitizedComment,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setEditMode(false);
    setComments((prev) =>
      prev.map((prevComment) =>
        prevComment.id === commentId ? data : prevComment
      )
    );
  };

  const handleDeleteComment = async (commentId) => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUDIENCE,
        scope: "read:current_user",
      },
    });

    await axios.delete(
      `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}/comments/${commentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setEditMode(false);
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  return (
    <div>
      <Button onClick={() => setEditMode(!editMode)} className="special-button">
        {editMode ? (
          <>
            Cancel <FontAwesomeIcon icon={faTimes} />
          </>
        ) : (
          <FontAwesomeIcon icon={faEdit} />
        )}
      </Button>
      <br />
      {editMode && (
        <div>
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              type="text"
              value={updatedComment.text || comment.text}
              onChange={({ target }) =>
                setUpdatedComment((prev) => ({ ...prev, text: target.value }))
              }
            />
          </Form.Group>

          <Button
            onClick={() => handleUpdateComment(comment.id)}
            className="special-button"
          >
            Update <FontAwesomeIcon icon={faCheck} />
          </Button>
          <Button
            onClick={() => handleDeleteComment(comment.id)}
            className="special-button"
          >
            Delete <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      )}
    </div>
  );
}
