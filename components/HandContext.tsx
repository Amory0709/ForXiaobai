import React, { createContext, useContext, useEffect, useRef, useState, MutableRefObject } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

type HandGesture = 'open' | 'closed' | 'none';

interface HandContextType {
  isTracking: boolean;
  isInitializing: boolean;
  // Use a ref for position to avoid re-rendering components every frame (60fps)
  handPositionRef: MutableRefObject<{ x: number; y: number } | null>;
  gestureRef: MutableRefObject<HandGesture>;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startCamera: () => void;
}

const HandContext = createContext<HandContextType>({
  isTracking: false,
  isInitializing: true,
  handPositionRef: { current: null },
  gestureRef: { current: 'none' },
  videoRef: { current: null },
  canvasRef: { current: null },
  startCamera: () => {},
});

export const useHandTracking = () => useContext(HandContext);

export const HandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Mutable refs for high-frequency updates without re-renders
  const handPositionRef = useRef<{ x: number; y: number } | null>(null);
  const gestureRef = useRef<HandGesture>('none');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const drawResults = (landmarks: any[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Simple custom drawing for high performance
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00ff00';
      ctx.fillStyle = '#00ff00';

      // Draw connections
      const connections = HandLandmarker.HAND_CONNECTIONS;
      for (const connection of connections) {
          const start = landmarks[connection.start];
          const end = landmarks[connection.end];
          ctx.beginPath();
          ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
          ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
          ctx.stroke();
      }

      // Draw points
      for (const point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fill();
      }
  };

  const detectGesture = (landmarks: any[]) => {
      // 0: Wrist
      // 9: Middle Finger MCP (base)
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];
      
      // Calculate palm size reference (distance from wrist to middle finger base)
      const palmSize = Math.sqrt(
          Math.pow(middleMCP.x - wrist.x, 2) + 
          Math.pow(middleMCP.y - wrist.y, 2)
      );

      // Check fingertips distance from wrist
      // 8: Index, 12: Middle, 16: Ring, 20: Pinky
      const tips = [8, 12, 16, 20];
      let curledFingers = 0;

      tips.forEach(tipIdx => {
          const tip = landmarks[tipIdx];
          const distToWrist = Math.sqrt(
              Math.pow(tip.x - wrist.x, 2) + 
              Math.pow(tip.y - wrist.y, 2)
          );
          // If tip is close to wrist (relative to palm size), it's curled
          if (distToWrist < palmSize * 1.3) { // 1.3 is a threshold factor
              curledFingers++;
          }
      });

      // If 3 or more fingers are curled, consider it closed (fist)
      if (curledFingers >= 3) {
          return 'closed';
      }
      return 'open';
  };

  const predictWebcam = () => {
    // Only run if video is playing and has data
    if (
        landmarkerRef.current && 
        videoRef.current && 
        videoRef.current.readyState >= 2 && 
        !videoRef.current.paused
    ) {
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        setIsTracking((prev) => !prev ? true : prev);
        
        const landmarks = results.landmarks[0];
        
        // Draw skeleton
        drawResults(landmarks);

        // Detect Gesture
        const gesture = detectGesture(landmarks);
        gestureRef.current = gesture;

        // Get index finger tip (landmark 8)
        const indexTip = landmarks[8];
        if (indexTip) {
            handPositionRef.current = { x: indexTip.x, y: indexTip.y };
        }
      } else {
        setIsTracking((prev) => prev ? false : prev);
        handPositionRef.current = null;
        gestureRef.current = 'none';
        
        // Clear canvas
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
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
          facingMode: 'user',
          frameRate: { ideal: 30 }
        } 
      });
      
      // Secondary check: Ensure video ref is still attached after async call
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', () => {
           // Resize canvas to match video
           if (canvasRef.current && videoRef.current) {
               canvasRef.current.width = videoRef.current.videoWidth;
               canvasRef.current.height = videoRef.current.videoHeight;
           }
           predictWebcam();
        });
      } else {
        // If the component unmounted or ref changed, stop the stream immediately
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Error detecting camera:", err);
    }
  };

  useEffect(() => {
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
  }, []);

  return (
    <HandContext.Provider value={{ isTracking, isInitializing, handPositionRef, gestureRef, videoRef, canvasRef, startCamera }}>
      {children}
    </HandContext.Provider>
  );
};