import html2canvas from "html2canvas";
import { useEffect, useRef, useState } from "react";
import { Image, Layer, Stage } from "react-konva";
import frame1 from './../frame/1.png';
import frame2 from './../frame/2.png';

const frameImages = [frame1, frame2];

const ImageEditor = () => {
  const [selectedFrame, setSelectedFrame] = useState(frameImages[0]);
  const [konvaImage, setKonvaImage] = useState(null);
  const [frameImage, setFrameImage] = useState(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [isEditing, setIsEditing] = useState(false);
  const stageRef = useRef(null);
  const imageLayerRef = useRef(null);
  const frameLayerRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Updated frame dimensions
  const frameWidth = 600; // New width
  const frameHeight = 600; // Adjusted height to maintain aspect ratio (4:3)

  // Load frame image
  useEffect(() => {
    const img = new window.Image();
    img.src = selectedFrame;
    img.crossOrigin = "anonymous";
    img.onload = () => setFrameImage(img);
  }, [selectedFrame]);

  // Handle image upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.crossOrigin = "anonymous"; // Ensure proper rendering
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          
          let newWidth = frameWidth;
          let newHeight = frameHeight;

          if (aspectRatio > (frameWidth / frameHeight)) {
            newHeight = frameWidth / aspectRatio; // Scale height proportionally
          } else {
            newWidth = frameHeight * aspectRatio; // Scale width proportionally
          }

          setKonvaImage(img);
          setImageSize({ width: newWidth, height: newHeight });
          setImagePosition({ x: (frameWidth - newWidth) / 2, y: (frameHeight - newHeight) / 2 });

          // Move uploaded image to top layer when added
          setIsEditing(true);
          if (imageLayerRef.current) {
            imageLayerRef.current.moveToTop();
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Edit/Done
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);

    if (!isEditing) {
      if (imageLayerRef.current) {
        imageLayerRef.current.moveToTop();
      }
    } else {
      if (frameLayerRef.current) {
        frameLayerRef.current.moveToTop();
      }
    }
  };

  // Handle zoom
  const handleZoom = (e) => {
    const scale = parseFloat(e.target.value);
    setImageScale(scale);

    if (!isEditing) {
      setIsEditing(true);
      if (imageLayerRef.current) {
        imageLayerRef.current.moveToTop();
      }
    }
  };

  // Handle drag movement
  const handleDragMove = (e) => {
    setImagePosition({ x: e.target.x(), y: e.target.y() });

    if (!isEditing) {
      setIsEditing(true);
      if (imageLayerRef.current) {
        imageLayerRef.current.moveToTop();
      }
    }
  };

  // Handle download
  const handleDownload = () => {
    html2canvas(stageRef.current.container()).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "framed-image.png";
      link.click();
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Avatar For OPPOers</h2>

      <div style={styles.uploadContainer}>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={styles.fileInput}
          id="fileInput"
        />
        <label htmlFor="fileInput" style={styles.uploadButton}>
          Upload Image
        </label>
      </div>

      

      <div style={styles.editorContainer}>
        <Stage width={frameWidth} height={frameHeight} ref={stageRef}>
          <Layer ref={imageLayerRef}>
            {konvaImage && (
  <Image
    image={konvaImage}
    draggable
    width={imageSize.width * imageScale}
    height={imageSize.height * imageScale}
    x={imagePosition.x}
    y={imagePosition.y}
    onDragMove={handleDragMove}
    listening={true} // Ensures interactivity
  />
)}
          </Layer>

          <Layer ref={frameLayerRef}>
            {frameImage && (
              <Image
                image={frameImage}
                width={frameWidth}
                height={frameHeight}
              />
            )}
          </Layer>
        </Stage>
      </div>
      <div style={styles.frameSelector}>
        {frameImages.map((frame, index) => (
          <img
            key={index}
            src={frame}
            alt={`Frame ${index + 1}`}
            style={{
              ...styles.frameThumbnail,
              border: selectedFrame === frame ? "3px solid #007BFF" : "2px solid #ddd",
            }}
            onClick={() => setSelectedFrame(frame)}
          />
        ))}
      </div>
      
      {konvaImage &&
        <div style={styles.controls}>
          <div style={styles.zoomControl}>
            <label style={styles.zoomLabel}>Zoom: </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={imageScale}
              onChange={handleZoom}
              style={styles.zoomSlider}
            />
          </div>

          <button onClick={toggleEditMode} style={styles.editButton}>
            {isEditing ? "Done" : "Edit"}
          </button>

          <button onClick={handleDownload} style={styles.downloadButton}>
            Download Final Image
          </button>
        </div>
      }
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
    fontFamily: "'Arial', sans-serif",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
  },
  uploadContainer: {
    marginBottom: "20px",
  },
  fileInput: {
    display: "none",
  },
  uploadButton: {
    backgroundColor: "#007BFF",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
  },
  frameSelector: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  frameThumbnail: {
    width: "80px",
    height: "80px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "border-color 0.3s ease",
  },
  editorContainer: {
    width: "600px", // Updated to match frame width
    height: "600px", // Updated to match frame height
    margin: "20px auto",
    border: "2px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "20px",
  },
  zoomControl: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  zoomLabel: {
    fontSize: "16px",
    color: "#333",
  },
  zoomSlider: {
    width: "150px",
  },
  editButton: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    border: "none",
    transition: "background-color 0.3s ease",
  },
  downloadButton: {
    backgroundColor: "#dc3545",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    border: "none",
    transition: "background-color 0.3s ease",
  },
};

export default ImageEditor;