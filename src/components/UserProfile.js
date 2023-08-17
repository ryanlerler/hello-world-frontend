import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Button, Toast } from "react-bootstrap";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { storage } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuth0 } from "@auth0/auth0-react";
import Filter from "bad-words";

const filter = new Filter();

export default function UserProfile({ setProfilePicUrl }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [updatedProfile, setUpdatedProfile] = useState({});
  const [photoFileInputFile, setPhotoFileInputFile] = useState(null);
  const [photoFileInputValue, setPhotoFileInputValue] = useState("");
  const { userId } = useParams();
  const { getAccessTokenSilently, user } = useAuth0();
  const [showToast, setShowToast] = useState(false);

  const PROFILE_PICTURE_STORAGE_KEY = `profile-pictures/${userId}`;

  useEffect(() => {
    const fetchUser = async () => {
      if (user && user.email) {
        const { data } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/users`,
          {
            params: {
              email: user.email,
            },
          }
        );
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchUser();
  }, [user, userId]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: process.env.REACT_APP_AUDIENCE,
        scope: "read:current_user",
      },
    });

    let profilePicUrl = null;

    const uniquePictureFileName = photoFileInputFile.name + uuidv4();
    const pictureFileRef = storageRef(
      storage,
      `${PROFILE_PICTURE_STORAGE_KEY}${uniquePictureFileName}`
    );

    await uploadBytes(pictureFileRef, photoFileInputFile);

    profilePicUrl = await getDownloadURL(pictureFileRef);

    setProfilePicUrl(profilePicUrl);

    const sanitizedNickname = filter.isProfane(updatedProfile.nickname)
      ? filter.clean(updatedProfile.nickname)
      : updatedProfile.nickname;

    const sanitizedCountry = filter.isProfane(updatedProfile.country)
      ? filter.clean(updatedProfile.country)
      : updatedProfile.country;

    const { data } = await axios.put(
      `${process.env.REACT_APP_BACKEND_URL}/users`,
      {
        nickname: sanitizedNickname || profile.nickname,
        profilePicUrl: profilePicUrl || profile.profilePicUrl,
        country: sanitizedCountry || profile.country,
        email: user.email,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setProfile((prev) => ({
      ...prev,
      nickname: data.nickname || profile.nickname,
      profilePicUrl: data.profilePicUrl || profile.profilePicUrl,
      country: data.country || profile.country,
    }));

    setShowToast(true);
  };

  const handlePictureFileChange = ({ target }) => {
    const { files, value } = target;
    setPhotoFileInputFile(files[0]);
    setPhotoFileInputValue(value);
  };

  return (
    <div>
      <div>
        <Form onSubmit={handleUpdate}>
          <Form.Label className="fs-5">
            <strong>Account:</strong> {user && user.email}
          </Form.Label>
          <br />
          <Form.Label className="fs-5">Display Name</Form.Label>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={updatedProfile.nickname || profile.nickname}
              onChange={({ target }) =>
                setUpdatedProfile((prev) => ({
                  ...prev,
                  nickname: target.value,
                }))
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fs-5">Profile Picture</Form.Label>
            <Form.Control
              type="file"
              value={photoFileInputValue}
              onChange={handlePictureFileChange}
              accept="image/*"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fs-5">Country</Form.Label>
            <Form.Control
              type="text"
              value={updatedProfile.country || profile.country}
              onChange={({ target }) =>
                setUpdatedProfile((prev) => ({
                  ...prev,
                  country: target.value,
                }))
              }
              required
              placeholder="Country"
            />
          </Form.Group>

          <Button type="submit" className="special-button">
            Update
          </Button>
          <Button onClick={() => navigate(-1)} className="special-button">
            Cancel
          </Button>
        </Form>
      </div>
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={3000}
        autohide
      >
        <Toast.Body>Profile updated successfully!</Toast.Body>
      </Toast>
    </div>
  );
}
