import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { useHandTracking } from './HandContext';

interface TreeProps {
  colors: {
    leaf: string;
    light: string;
  };
  rotationSpeed: number;
}

// --- Geometry Components ---

const GlassGiftBox = ({ position, rotation, scale, color, ribbonColor = "#ffffff" }: any) => {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Glass Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.05} 
          metalness={0.2} 
          transmission={0.7} // Glassy
          thickness={0.8}
          ior={1.45}
          clearcoat={1}
          attenuationColor={color}
          attenuationDistance={1}
        />
      </mesh>
      {/* Inner Emissive Core (to make it glow from inside) */}
      <mesh scale={[0.85, 0.85, 0.85]}>
         <boxGeometry args={[1, 1, 1]} />
         <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      
      {/* Ribbon Vertical */}
      <mesh position={[0, 0, 0]} scale={[1.02, 1.02, 0.2]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Ribbon Horizontal */}
      <mesh position={[0, 0, 0]} scale={[0.2, 1.02, 1.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={ribbonColor} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  );
};

const ParticleTreeLayer = ({ scale, position, color }: { scale: number; position: [number, number, number]; color: string }) => {
  const count = 1500; // Dense elegance
  
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        const coneHeight = scale * 1.5;
        const h = Math.random() * coneHeight; 
        const maxR = scale * (1 - h / coneHeight);
        const r = maxR * Math.sqrt(Math.random()); 
        
        const theta = Math.random() * Math.PI * 2;
        
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = h - coneHeight / 2;

        p[i * 3] = x;
        p[i * 3 + 1] = y;
        p[i * 3 + 2] = z;

        sizes[i] = Math.random();
    }
    return { positions: p, sizes };
  }, [count, scale]);

  const materialRef = useRef<THREE.PointsMaterial>(null);

  useFrame((state) => {
     if (materialRef.current) {
         // Gentle twinkling
         materialRef.current.size = 0.06 + Math.sin(state.clock.elapsedTime * 1.5) * 0.015;
     }
  });

  return (
    <points position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={points.positions.length / 3} array={points.positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        ref={materialRef}
        size={0.06} 
        color={color} 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
        sizeAttenuation={true}
      />
    </points>
  );
};

// --- Decorations Generators ---

const useDecorations = (count: number) => {
  return useMemo(() => {
    const items = [];
    // Elegant Palette: Rose, Champagne, White, Soft Gold
    const colors = ["#ffcce0", "#ffe5b4", "#ffffff", "#ffd700", "#e6e6fa"];
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const h = -1 + t * 5.5; 
      const r = 2.6 * (1 - t) + 0.3; 
      
      const angle = t * Math.PI * 12 + (Math.random() * 0.8); 
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      const jitterX = (Math.random() - 0.5) * 0.6;
      const jitterZ = (Math.random() - 0.5) * 0.6;

      const type = Math.random(); 
      
      items.push({
        position: [x + jitterX, h, z + jitterZ] as [number, number, number],
        rotation: [Math.random(), Math.random(), Math.random()] as [number, number, number],
        color: colors[Math.floor(Math.random() * colors.length)],
        type: type > 0.4 ? 'gift' : 'light',
        scale: type > 0.4 ? 0.22 : 0.12, 
      });
    }
    return items;
  }, [count]);
};

const GlowingGarland = () => {
  const curve = useMemo(() => {
    const points = [];
    const height = 6;
    const radiusBase = 2.8;
    const turns = 5;
    
    for (let i = 0; i <= 150; i++) {
      const t = i / 150;
      const x = Math.cos(t * Math.PI * 2 * turns) * (radiusBase * (1 - t) + 0.1);
      const z = Math.sin(t * Math.PI * 2 * turns) * (radiusBase * (1 - t) + 0.1);
      const y = -1.2 + t * height;
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  return (
    <mesh>
      <tubeGeometry args={[curve, 200, 0.03, 8, false]} />
      <meshStandardMaterial 
        color="#fff5e6" 
        emissive="#ffd700"
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
};

// --- Interactive Components ---

const InteractiveParticles = ({ count = 100, color }: { count: number; color: string }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const trailMesh = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const { handPosition, isTracking } = useHandTracking();
  
  // 1. Ambient Floating Particles that react to mouse/hand
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 15,
      y: (Math.random() - 0.5) * 15,
      z: (Math.random() - 0.5) * 10,
      vx: 0, vy: 0, vz: 0,
      s: Math.random() * 0.5 + 0.5
    }));
  }, [count]);

  // 2. Trail Particles (Ring Buffer)
  const trailCount = 50;
  const trailData = useMemo(() => {
     return new Array(trailCount).fill(0).map(() => ({
         x: 0, y: 0, z: 0, 
         vx: 0, vy: 0, vz: 0,
         life: 0, 
         active: false
     }));
  }, []);
  const currentTrailIdx = useRef(0);
  const lastTargetPos = useRef({ x: 0, y: 0 });

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
     if(!mesh.current || !trailMesh.current) return;
     
     let xTarget = 0;
     let yTarget = 0;
     const zTarget = 2;

     // --- Determine Target Position (Hand or Mouse) ---
     if (isTracking && handPosition) {
         // Map Hand (0..1) to Viewport
         // Mirror X: 1-x because webcam is mirrored
         // Flip Y: 1-y because MediaPipe Y is top-down
         const ndcX = (1 - handPosition.x) * 2 - 1; 
         const ndcY = -(handPosition.y * 2 - 1);
         xTarget = (ndcX * viewport.width) / 2;
         yTarget = (ndcY * viewport.height) / 2;
     } else {
         // Mouse Fallback
         xTarget = (state.pointer.x * viewport.width) / 2;
         yTarget = (state.pointer.y * viewport.height) / 2;
     }

     // --- Emit Trail ---
     const dxTarget = xTarget - lastTargetPos.current.x;
     const dyTarget = yTarget - lastTargetPos.current.y;
     const distTarget = Math.sqrt(dxTarget*dxTarget + dyTarget*dyTarget);
     
     // Emit if moved enough
     if (distTarget > 0.1) {
         const idx = currentTrailIdx.current;
         trailData[idx].active = true;
         trailData[idx].life = 1.0;
         trailData[idx].x = xTarget;
         trailData[idx].y = yTarget;
         trailData[idx].z = zTarget;
         // Add some random velocity scatter
         trailData[idx].vx = (Math.random() - 0.5) * 0.1;
         trailData[idx].vy = (Math.random() - 0.5) * 0.1;
         trailData[idx].vz = (Math.random() - 0.5) * 0.1;
         
         currentTrailIdx.current = (currentTrailIdx.current + 1) % trailCount;
         lastTargetPos.current = { x: xTarget, y: yTarget };
     }

     // --- Update Ambient Particles ---
     particles.forEach((p, i) => {
        const dx = xTarget - p.x;
        const dy = yTarget - p.y;
        const dz = zTarget - p.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Attraction force
        const force = Math.max(0, (6 - dist) / 6); 
        
        if (force > 0) {
            // Pull towards target
            p.vx += dx * 0.03 * force;
            p.vy += dy * 0.03 * force;
            p.vz += dz * 0.03 * force;
        }

        // Noise / Swirl
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;
        p.vz += (Math.random() - 0.5) * 0.02;

        // Friction
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.vz *= 0.95;
        
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        
        // Soft bounds
        if (Math.abs(p.x) > 10) p.vx -= p.x * 0.01;
        if (Math.abs(p.y) > 10) p.vy -= p.y * 0.01;
        if (Math.abs(p.z) > 8) p.vz -= p.z * 0.01;

        dummy.position.set(p.x, p.y, p.z);
        // Scale up when fast/near
        const scale = p.s * (0.5 + force * 1.5); 
        dummy.scale.setScalar(scale);
        dummy.rotation.set(state.clock.elapsedTime + i, state.clock.elapsedTime + i, 0);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
     });
     mesh.current.instanceMatrix.needsUpdate = true;

     // --- Update Trail Particles ---
     trailData.forEach((p, i) => {
         if (!p.active) {
             dummy.scale.setScalar(0);
         } else {
             p.life -= 0.02; // Fade out
             if (p.life <= 0) p.active = false;
             
             p.x += p.vx;
             p.y += p.vy;
             p.z += p.vz;
             p.y -= 0.02; // Gravity

             dummy.position.set(p.x, p.y, p.z);
             dummy.scale.setScalar(p.life * 0.8); // Shrink over life
             dummy.rotation.set(p.life * 5, p.life * 5, 0);
         }
         dummy.updateMatrix();
         trailMesh.current.setMatrixAt(i, dummy.matrix);
     });
     trailMesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
        {/* Ambient Interactive Dust */}
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </instancedMesh>
        {/* Hand/Mouse Trail */}
        <instancedMesh ref={trailMesh} args={[undefined, undefined, trailCount]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    </group>
  );
}

// --- Main Tree Component ---

export const Tree = ({ colors, rotationSpeed }: TreeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const decorations = useDecorations(65);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group>
      {/* The rotating tree part */}
      <group ref={groupRef}>
        
        {/* Central Core */}
        <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.02, 0.1, 7, 16]} />
            <meshBasicMaterial color={colors.leaf} transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Particle Tree Layers */}
        <ParticleTreeLayer position={[0, -1.0, 0]} scale={2.8} color={colors.leaf} />
        <ParticleTreeLayer position={[0, 0.2, 0]} scale={2.4} color={colors.leaf} />
        <ParticleTreeLayer position={[0, 1.4, 0]} scale={2.0} color={colors.leaf} />
        <ParticleTreeLayer position={[0, 2.5, 0]} scale={1.5} color={colors.leaf} />
        <ParticleTreeLayer position={[0, 3.4, 0]} scale={1.0} color={colors.leaf} />
        <ParticleTreeLayer position={[0, 4.0, 0]} scale={0.6} color={colors.leaf} />

        {/* Garland */}
        <GlowingGarland />

        {/* Decorations */}
        {decorations.map((d, i) => (
           <group key={i} position={d.position} rotation={d.rotation}>
              {d.type === 'gift' ? (
                 <GlassGiftBox scale={[d.scale, d.scale, d.scale]} color={d.color} ribbonColor="#e6e6fa" />
              ) : (
                <mesh scale={[d.scale, d.scale, d.scale]}>
                  <sphereGeometry args={[1.5, 32, 32]} />
                  <meshStandardMaterial 
                    color={colors.light} 
                    emissive={colors.light}
                    emissiveIntensity={2}
                    toneMapped={false}
                  /> 
                  <pointLight distance={1.5} intensity={1} color={colors.light} decay={2} />
                </mesh>
              )}
           </group>
        ))}

        {/* Top Star - Diamond / Crystal Look */}
        <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
          <group position={[0, 4.8, 0]}>
            <mesh castShadow>
              <octahedronGeometry args={[0.6, 0]} />
              <meshPhysicalMaterial 
                color="#ffffff" 
                transmission={0.9} 
                roughness={0} 
                metalness={0.1} 
                thickness={2}
                ior={2.4} // Diamond
                clearcoat={1}
              />
            </mesh>
            <mesh scale={1.2}>
               <octahedronGeometry args={[0.6, 0]} />
               <meshBasicMaterial color="#fff0f5" wireframe transparent opacity={0.2} />
            </mesh>
            <pointLight distance={10} intensity={8} color="#fff0f5" />
            <Sparkles count={30} scale={2} size={5} speed={0.5} color="#fff0f5" />
          </group>
        </Float>

      </group>
      
      {/* Floor Reflections */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -2.5, 0]}>
          <circleGeometry args={[5, 32]} />
          <meshBasicMaterial color={colors.leaf} transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Floating Magic Dust - NOW INTERACTIVE */}
      <InteractiveParticles count={250} color={colors.light} />
      
      {/* Background Ambience */}
      <Sparkles 
        count={100} 
        scale={[10, 10, 10]} 
        size={2} 
        speed={0.2} 
        opacity={0.3} 
        color={colors.light} 
      />
    </group>
  );
};
