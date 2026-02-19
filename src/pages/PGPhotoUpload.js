import React, { useEffect, useState } from "react";
import axios from "axios";

const PGPhotoUpload = ({ pgId }) => {
  const [photo, setPhoto] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchPhoto();
  }, [pgId]);

  const fetchPhoto = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/upload/${pgId}/photo`
    );
    if (res.data.success) setPhoto(res.data.photo);
  };

  const uploadPhoto = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    const res = await axios.post(
      `http://localhost:5000/api/upload/${pgId}/photo`,
      formData
    );

    if (res.data.success) setPhoto(res.data.photo);
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadPhoto}>Upload</button>

      {photo && (
        <img
          src={`http://localhost:5000${photo}`}
          width="200"
          alt="PG"
        />
      )}
    </div>
  );
};

export default PGPhotoUpload;
