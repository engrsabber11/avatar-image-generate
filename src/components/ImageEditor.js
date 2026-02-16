import { useEffect, useRef, useState } from "react";
import { Image, Layer, Stage } from "react-konva";

import frame1 from "./../frame/1.png";



const frameImages = [
  frame1,

];

export default function ImageEditor() {
  const [selectedFrame, setSelectedFrame] = useState(frameImages[0]);
  const [konvaImage, setKonvaImage] = useState(null);
  const [frameImage, setFrameImage] = useState(null);

  // Stage is now responsive (square) — size derived from container width
  const wrapperRef = useRef(null);
  const stageRef = useRef(null);
  const imageLayerRef = useRef(null);
  const frameLayerRef = useRef(null);

  const [stageSize, setStageSize] = useState({ width: 300, height: 300 });
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isEditing, setIsEditing] = useState(false);

  // Make the stage responsive using ResizeObserver
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const side = Math.min(el.clientWidth, 640); // cap at 640px for large screens
      setStageSize({ width: side, height: side });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load & cache the frame image
  useEffect(() => {
    const img = new window.Image();
    img.src = selectedFrame;
    img.crossOrigin = "anonymous";
    img.onload = () => setFrameImage(img);
  }, [selectedFrame]);

  // Handle upload (keeps the uploaded image proportionally fitted into the current stage size)
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const frameW = stageSize.width;
        const frameH = stageSize.height;
        const aspect = img.width / img.height;

        let newW = frameW;
        let newH = frameH;
        if (aspect > frameW / frameH) {
          newH = frameW / aspect;
        } else {
          newW = frameH * aspect;
        }

        setKonvaImage(img);
        setImageSize({ width: newW, height: newH });
        setImageScale(1);
        setImagePosition({ x: (frameW - newW) / 2, y: (frameH - newH) / 2 });
        setIsEditing(true);
        imageLayerRef.current?.moveToTop();
      };
    };
    reader.readAsDataURL(file);
  };

  // Re-fit uploaded image when stage size changes (device rotates / viewport changes)
  useEffect(() => {
    if (!konvaImage) return;
    const frameW = stageSize.width;
    const frameH = stageSize.height;
    const aspect = konvaImage.width / konvaImage.height;

    let newW = frameW;
    let newH = frameH;
    if (aspect > frameW / frameH) newH = frameW / aspect;
    else newW = frameH * aspect;

    // keep current scale but re-center base image size
    setImageSize({ width: newW, height: newH });
    setImagePosition({ x: (frameW - newW * imageScale) / 2, y: (frameH - newH * imageScale) / 2 });
  }, [stageSize.width, stageSize.height]); // eslint-disable-line

  const toggleEditMode = () => {
    setIsEditing((v) => {
      const next = !v;
      (next ? imageLayerRef : frameLayerRef).current?.moveToTop();
      return next;
    });
  };

  const handleZoom = (e) => {
    const scale = parseFloat(e.target.value);
    setImageScale(scale);
    if (!isEditing) {
      setIsEditing(true);
      imageLayerRef.current?.moveToTop();
    }
  };

  const handleDragMove = (e) => {
    setImagePosition({ x: e.target.x(), y: e.target.y() });
    if (!isEditing) {
      setIsEditing(true);
      imageLayerRef.current?.moveToTop();
    }
  };

  // Mobile-friendly export: use Konva’s own toDataURL (more reliable than html2canvas on iOS/Android)
  const handleDownload = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: window.devicePixelRatio || 2 });
    const link = document.createElement("a");
    link.href = uri;
    link.download = "framed-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Optional: pinch-to-zoom support (two-finger gesture)
  useEffect(() => {
    const stage = stageRef.current?.getStage();
    if (!stage) return;

    let lastDist = 0;

    const getDistance = (p1, p2) =>
      Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

    const onTouchMove = (evt) => {
      const t = evt.evt.touches;
      if (t.length === 2 && konvaImage) {
        evt.evt.preventDefault();
        const dist = getDistance(t[0], t[1]);
        if (!lastDist) {
          lastDist = dist;
          return;
        }
        const delta = dist / lastDist;
        lastDist = dist;

        // zoom around center of stage for simplicity
        setImageScale((s) => {
          const next = Math.min(3, Math.max(0.5, s * delta));
          return next;
        });
        setIsEditing(true);
        imageLayerRef.current?.moveToTop();
      }
    };

    const onTouchEnd = () => {
      lastDist = 0;
    };

    stage.on("touchmove", onTouchMove);
    stage.on("touchend", onTouchEnd);
    stage.on("touchcancel", onTouchEnd);

    return () => {
      stage.off("touchmove", onTouchMove);
      stage.off("touchend", onTouchEnd);
      stage.off("touchcancel", onTouchEnd);
    };
  }, [konvaImage]);

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

      <div ref={wrapperRef} style={styles.editorWrapper}>

        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          style={{ width: "100%", height: "auto", touchAction: "none" }}
        >
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
                listening
              />
            )}
          </Layer>
          <Layer ref={frameLayerRef}>
            {frameImage && (
              <Image image={frameImage} width={stageSize.width} height={stageSize.height} />
            )}
          </Layer>
        </Stage>
      </div>

      <div style={styles.frameSelector}>
        {frameImages.map((frame, i) => (
          <img
            key={i}
            src={frame}
            alt={`Frame ${i + 1}`}
            style={{
              ...styles.frameThumbnail,
              border: selectedFrame === frame ? "3px solid #007BFF" : "2px solid #ddd",
            }}
            onClick={() => setSelectedFrame(frame)}
          />
        ))}
      </div>

      {konvaImage && (
        <div style={styles.controls}>
          <div style={styles.zoomControl}>
            <label style={styles.zoomLabel}>Zoom</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={imageScale}
              onChange={handleZoom}
              style={styles.zoomSlider}
            />
          </div>

          <button onClick={toggleEditMode} style={styles.editButton}>
            {isEditing ? "Done" : "Edit"}
          </button>

          <button onClick={handleDownload} style={styles.downloadButton}>
            Download
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "16px",
    fontFamily: "'Arial', sans-serif",
    backgroundColor: "#f9f9f9",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    maxWidth: 820,
    margin: "0 auto",
  },
  title: { fontSize: 22, color: "#333", marginBottom: 16 },
  uploadContainer: { marginBottom: 16 },
  fileInput: { display: "none" },
  uploadButton: {
    backgroundColor: "#007BFF",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: 16,
  },
  editorWrapper: { width: "100%", maxWidth: 640, margin: "12px auto" },
  editorContainer: {
    width: "100%",
    aspectRatio: "1 / 1", // keeps the area square while Stage fills it
    border: "2px solid #ddd",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  frameSelector: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    margin: "14px 0",
    flexWrap: "wrap",
  },
  frameThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 6,
    objectFit: "cover",
    cursor: "pointer",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  },
  zoomControl: { display: "flex", alignItems: "center", gap: 8 },
  zoomLabel: { fontSize: 16, color: "#333" },
  zoomSlider: { width: 180 },
  editButton: {
    backgroundColor: "#28a745",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: 16,
  },
  downloadButton: {
    backgroundColor: "#dc3545",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    fontSize: 16,
  },
};
