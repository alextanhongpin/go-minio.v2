import styles from "./App.module.css";
import { useRef, useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  isInternalImageSource,
  uploadImage,
  downloadImage,
} from "service/image-uploader";

function App() {
  const [image, setImage] = useState(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const timeout = useRef(null);
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];

    try {
      const imageUrl = await uploadImage(file);
      setImage({ url: imageUrl, name: file.name });
      setValue(imageUrl);
    } catch (err) {
      setError(err);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    maxFiles: 1, // Only 1 image per drop.
  });

  useEffect(() => {
    if (!copied) return;
    timeout && window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [copied]);

  const handleCopyToClipboard = () => {
    if (!image?.url) {
      return;
    }
    if (!navigator.clipboard) {
      setError("Unable to copy to clipboard");
      return;
    }
    navigator.clipboard.writeText(image.url).then(
      function () {
        setCopied(true);
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  };

  const handleChange = async (e) => {
    const value = e.target.value;
    // We only handle uploading if the image is from an external source,
    // and not stored in our buckets.
    if (isInternalImageSource(value)) {
      setImage({ url: value, name: value });
      setValue(value);
      return;
    }

    // If the image is from an external source, we download it and upload it
    // back to our bucket.
    try {
      const file = await downloadImage(value);
      const imageUrl = await uploadImage(file);
      setImage({ url: imageUrl, name: file.name });
      setValue(imageUrl);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Image Uploader</h1>
      </header>

      {error && <div>{error.message}</div>}

      <div {...getRootProps()} className={styles.dragzone}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      <div>
        <input type="text" value={value} onChange={handleChange} />
        <button onClick={handleCopyToClipboard}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {image && (
        <img
          className={styles.image}
          key={image?.url}
          src={image?.url}
          alt={image.name}
        />
      )}
    </div>
  );
}

export default App;
