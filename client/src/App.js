import styles from "./App.module.css";
import { useRef, useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  isInternalImageSource,
  uploadImage,
  downloadImage,
} from "service/image-uploader";

function ImagePreview({ value: defaultValue = "", status }) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const timeout = useRef(null);

  useEffect(() => {
    if (!copied) return;
    timeout && window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => {
      setCopied(false);
    }, 1000);
  }, [copied]);

  const handleCopyToClipboard = () => {
    if (!value) {
      return;
    }
    if (!navigator.clipboard) {
      setError("Unable to copy to clipboard");
      return;
    }
    navigator.clipboard.writeText(value).then(
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
      setValue(value);
      return;
    }

    // If the image is from an external source, we download it and upload it
    // back to our bucket.
    try {
      const file = await downloadImage(value);
      const imageUrl = await uploadImage(file);
      setValue(imageUrl);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div>
      {error && <div>{error.message}</div>}
      <div>
        <input type="text" value={value} onChange={handleChange} />
        <button onClick={handleCopyToClipboard}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {status}

      {value && (
        <img className={styles.image} key={value} src={value} alt={value} />
      )}
    </div>
  );
}

function App() {
  const [images, setImages] = useState([]);
  const onDrop = useCallback(async (acceptedFiles) => {
    const images = await Promise.allSettled(acceptedFiles.map(uploadImage));
    setImages(images);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    maxFiles: 5, // Only 5 images per drop.
  });

  return (
    <div className="App">
      <header>
        <h1>Image Uploader</h1>
      </header>

      <div {...getRootProps()} className={styles.dragzone}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {images.map((props) => (
        <ImagePreview {...props} />
      ))}
    </div>
  );
}

export default App;
