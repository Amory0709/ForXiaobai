import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

interface HandContextType {
  isTracking: boolean;
  isInitializing: boolean;
  handPosition: { x: number; y: number } | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: () => void;
}

const HandContext = createContext<HandContextType>({
  isTracking: false,
  isInitializing: true,
  handPosition: null,
  videoRef: { current: null },
  startCamera: () => {},
});

export const useHandTracking = () => useContext(HandContext);

export const HandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setIsInitializing(false);
      } catch (error) {
        console.error("Error initializing hand landmarker:", error);
        setIsInitializing(false);
      }
    };
    initLandmarker();
  }, []);

  const predictWebcam = () => {
    if (landmarkerRef.current && videoRef.current && videoRef.current.readyState === 4) {
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        setIsTracking(true);
        // Get index finger tip (landmark 8)
        const indexTip = results.landmarks[0][8];
        if (indexTip) {
            setHandPosition({ x: indexTip.x, y: indexTip.y });
        }
      } else {
        setIsTracking(false);
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const startCamera = async () => {
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 320, 
          height: 240,
          facingMode: 'user'
        } 
      });
      videoRef.current.srcObject = stream;
      videoRef.current.addEventListener('loadeddata', predictWebcam);
    } catch (err) {
      console.error("Error detecting camera:", err);
    }
  };

  useEffect(() => {
      // Cleanup
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
  }, []);

  return (
    <HandContext.Provider value={{ isTracking, isInitializing, handPosition, videoRef, startCamera }}>
      {children}
    </HandContext.Provider>
  );
};
