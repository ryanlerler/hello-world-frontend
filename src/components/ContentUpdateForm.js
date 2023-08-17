import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "react-bootstrap/esm/Button";
import { Form } from "react-bootstrap";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuth0 } from "@auth0/auth0-react";
import Filter from "bad-words";
import { faCheck, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const filter = new Filter();

const VIDEO_STORAGE_KEY = "videos/";
const PICTURE_STORAGE_KEY = "pictures/";

export default function ContentUpdateForm({ content, setContent }) {
  const navigate = useNavigate();
  const [updatedContent, setUpdatedContent] = useState({});
  const [options, setOptions] = useState([]);
  const [userOption, setUserOption] = useState("");
  const [videoFileInputFile, setVideoFileInputFile] = useState(null);
  const [videoFileInputValue, setVideoFileInputValue] = useState("");
  const [photoFileInputFile, setPhotoFileInputFile] = useState(null);
  const [photoFileInputValue, setPhotoFileInputValue] = useState("");
  const { contentId } = useParams();
  const { getAccessTokenSilently } = useAuth0();

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

  const handleUpdate = async (e, id) => {
    e.preventDefault();

    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUDIENCE,
        scope: "read:current_user",
      },
    });

    const uniqueVideoFileName = videoFileInputFile.name + uuidv4();
    const videoFileRef = storageRef(
      storage,
      `${VIDEO_STORAGE_KEY}${uniqueVideoFileName}`
    );

    await uploadBytes(videoFileRef, videoFileInputFile);

    const videoUrl = await getDownloadURL(videoFileRef);

    let photoUrl = null;
    if (photoFileInputFile) {
      const uniquePictureFileName = photoFileInputFile.name + uuidv4();
      const pictureFileRef = storageRef(
        storage,
        `${PICTURE_STORAGE_KEY}${uniquePictureFileName}`
      );

      await uploadBytes(pictureFileRef, photoFileInputFile);

      photoUrl = await getDownloadURL(pictureFileRef);
    }

    const sanitizedTitle = filter.isProfane(updatedContent.title)
      ? filter.clean(updatedContent.title)
      : updatedContent.title;

    const sanitizedDescription = filter.isProfane(updatedContent.description)
      ? filter.clean(updatedContent.description)
      : updatedContent.description;

    const { data } = await axios.put(
      `${process.env.REACT_APP_BACKEND_URL}/contents/${id}`,
      {
        title: sanitizedTitle || content.title,
        description: sanitizedDescription || content.description,
        videoUrl: videoUrl || content.videoUrl,
        photoUrl: photoUrl || content.photoUrl,
        externalReferenceUrl:
          updatedContent.externalReferenceUrl || content.externalReferenceUrl,
        categoryId: userOption.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setContent((prev) => ({
      ...prev,
      title: data.title || content.title,
      description: data.description || content.description,
      videoUrl: data.videoUrl || content.videoUrl,
      photoUrl: data.photoUrl || content.photoUrl,
      externalReferenceUrl:
        data.externalReferenceUrl || content.externalReferenceUrl,
      category: data.map((option) => ({
        value: option.id,
        label: option.name,
      })),
    }));

    navigate(`/contents/${id}`);
  };

  const handleVideoFileChange = ({ target }) => {
    const { files, value } = target;
    setVideoFileInputFile(files[0]);
    setVideoFileInputValue(value);
  };

  const handlePictureFileChange = ({ target }) => {
    const { files, value } = target;
    setPhotoFileInputFile(files[0]);
    setPhotoFileInputValue(value);
  };

  const handleDeleteContent = async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUDIENCE,
        scope: "read:current_user",
      },
    });

    await axios.delete(
      `${process.env.REACT_APP_BACKEND_URL}/contents/${contentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setContent((prev) => {
      const updatedContent = { ...prev };
      delete updatedContent[contentId];
      return updatedContent;
    });

    alert("DELETED");

    navigate("/contents");
  };

  return (
    <div>
      <div>
        <Form onSubmit={(e) => handleUpdate(e, content.id)}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={updatedContent.title || content.title}
              onChange={({ target }) =>
                setUpdatedContent((prev) => ({ ...prev, title: target.value }))
              }
              required
              minLength={3}
              maxLength={35}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={updatedContent.description || content.description}
              onChange={({ target }) =>
                setUpdatedContent((prev) => ({
                  ...prev,
                  description: target.value,
                }))
              }
              required
              minLength={3}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fs-5">
              <strong> ONE </strong>video accepted
            </Form.Label>
            <Form.Control
              type="file"
              value={videoFileInputValue}
              onChange={handleVideoFileChange}
              required
              accept="video/*"
            />
          </Form.Group>

          <Form.Label>Category</Form.Label>
          <Select
            components={makeAnimated()}
            options={options}
            value={userOption}
            onChange={(selectedOption) => setUserOption(selectedOption)}
            styles={{
              option: (defaultStyles) => ({
                ...defaultStyles,
                color: "black",
              }),
            }}
            required
          />
          <br />

          <Form.Label className="fs-5">
            <strong> Optional Fields </strong>
          </Form.Label>

          <Form.Group className="mb-3">
            <Form.Label className="fs-5">
              <strong> ONE </strong>picture accepted
            </Form.Label>
            <Form.Control
              type="file"
              value={photoFileInputValue}
              onChange={handlePictureFileChange}
              accept="image/*"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              type="url"
              placeholder="Link to your Github, social media, etc."
              value={
                updatedContent.externalReferenceUrl ||
                content.externalReferenceUrl
              }
              onChange={({ target }) =>
                setUpdatedContent((prev) => ({
                  ...prev,
                  externalReferenceUrl: target.value,
                }))
              }
              pattern="https?://.*"
            />
          </Form.Group>

          <Button type="submit" className="special-button">
            Update <FontAwesomeIcon icon={faCheck} />
          </Button>
          <Button onClick={handleDeleteContent} className="special-button">
            Delete <FontAwesomeIcon icon={faTrash} />
          </Button>
          <Button
            onClick={() => navigate(`/contents/${contentId}`)}
            className="special-button"
          >
            Cancel <FontAwesomeIcon icon={faTimes} />
          </Button>
        </Form>
      </div>
    </div>
  );
}
