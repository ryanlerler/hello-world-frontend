import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import { Button, Form } from "react-bootstrap";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuth0 } from "@auth0/auth0-react";
import Filter from "bad-words";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const filter = new Filter();

const VIDEO_STORAGE_KEY = "videos/";
const PICTURE_STORAGE_KEY = "pictures/";

export default function ContributeForm() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFileInputFile, setVideoFileInputFile] = useState(null);
  const [videoFileInputValue, setVideoFileInputValue] = useState("");
  const [photoFileInputFile, setPhotoFileInputFile] = useState(null);
  const [photoFileInputValue, setPhotoFileInputValue] = useState("");
  const [externalReferenceUrl, setExternalReferenceUrl] = useState("");
  const [options, setOptions] = useState([]);
  const [userOption, setUserOption] = useState("");
  const { user, getAccessTokenSilently } = useAuth0();

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

  const handleSubmit = async (e) => {
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

    const sanitizedTitle = filter.isProfane(title)
      ? filter.clean(title)
      : title;

    const sanitizedDescription = filter.isProfane(description)
      ? filter.clean(description)
      : description;

    const { data } = await axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/contents`,
      {
        title: sanitizedTitle,
        description: sanitizedDescription,
        videoUrl,
        photoUrl,
        externalReferenceUrl: externalReferenceUrl || null,
        categoryId: userOption.value,
        email: user.email,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    navigate(`/contents/${data.id}`);
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

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            placeholder="Add A Title"
            value={title}
            onChange={({ target }) => setTitle(target.value)}
            required
            minLength={3}
            maxLength={35}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            type="text"
            placeholder="Add A Description"
            value={description}
            onChange={({ target }) => setDescription(target.value)}
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
            value={externalReferenceUrl}
            onChange={({ target }) => setExternalReferenceUrl(target.value)}
            pattern="https?://.*"
          />
        </Form.Group>

        <Button type="submit" className="special-button">
          Submit <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </Form>
    </div>
  );
}
