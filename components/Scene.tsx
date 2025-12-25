import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stars, ContactShadows, Text, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { Tree } from './Tree';
import { Snow } from './Snow';
import { TreeConfig } from '../types';

interface SceneProps {
  config: TreeConfig;
}

const Ground = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      {/* Dark Wine/Purple Ground for contrast with Pink */}
      <meshStandardMaterial color="#1a0b14" roughness={0.2} metalness={0.5} />
    </mesh>
  );
};

export const Scene: React.FC<SceneProps> = ({ config }) => {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMappingExposure: 1.2 }}>
      <PerspectiveCamera makeDefault position={[0, 1, 9]} fov={50} />
      
      {/* Controls - Enhanced for Gesture Feel */}
      <OrbitControls 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.05} 
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={18}
        autoRotate={true}
        autoRotateSpeed={0.5}
        enableDamping={true} // Adds weight/inertia to gestures
        dampingFactor={0.05} // Smooth stop
        rotateSpeed={0.5} // More precise control
      />

      {/* Lighting - Warm and Soft */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={10} color="#fff0f5" />
      <pointLight position={[-10, 5, -10]} intensity={15} color={config.treeColor} />
      <spotLight 
        position={[0, 10, 0]} 
        angle={0.5} 
        penumbra={1} 
        intensity={20} 
        color="#ffd700" 
        castShadow 
      />
      
      {/* Environment - Studio or City for reflections */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={0.5} />
      <Environment preset="city" background={false} blur={0.8} />

      {/* Objects */}
      <group position={[0, -1, 0]}>
        <Tree 
            colors={{ leaf: config.treeColor, light: config.lightColor }} 
            rotationSpeed={config.rotationSpeed}
        />
        {config.showSnow && <Snow count={250} />}
        <Ground />
      </group>
      
      {/* Post Processing - Soft Bloom */}
      {config.isShiny && (
        <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.0} radius={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
            <Noise opacity={0.02} />
        </EffectComposer>
      )}

      {/* 3D Text Title */}
       <Float position={[0, 6, 0]} rotationIntensity={0.1} floatIntensity={0.2}>
         <Text
           font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
           fontSize={1}
           color="#fff0f5"
           anchorX="center"
           anchorY="middle"
           outlineWidth={0.02}
           outlineColor="#d4af37"
           maxWidth={8}
           textAlign="center"
         >
           Merry Christmas
           <meshPhysicalMaterial 
             color="#fff0f5" 
             emissive="#fff0f5" 
             emissiveIntensity={0.2} 
             metalness={0.8} 
             roughness={0.2} 
             clearcoat={1}
           />
         </Text>
       </Float>

    </Canvas>
  );
};
