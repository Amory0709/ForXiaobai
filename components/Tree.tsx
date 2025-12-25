import React, { Component, useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
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

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Simple Error Boundary to catch texture loading errors without crashing the whole app
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// --- Placeholder Component (Shows when image is missing) ---
const PhotoPlaceholder = ({ position, rotation }: any) => {
  return (
    <group position={position} rotation={rotation}>
       <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
        {/* Frame - Adjusted to 3:4 Ratio (approx) */}
        <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 2.0, 0.05]} />
            <meshStandardMaterial color="#fff0f5" roughness={0.4} metalness={0.1} />
        </mesh>
        
        {/* The Pink Background */}
        <mesh position={[0, 0.1, 0.03]}>
            <planeGeometry args={[1.2, 1.6]} /> 
            <meshBasicMaterial color="#ffdae9" />
        </mesh>

        {/* Question Mark Symbol */}
         <group position={[0, 0.2, 0.04]}>
            {/* Curve */}
            <mesh position={[0, 0.25, 0]} rotation={[0,0,0]}>
                <torusGeometry args={[0.2, 0.05, 16, 32, Math.PI]} />
                <meshStandardMaterial color="#ff69b4" />
            </mesh>
            {/* Vertical Line */}
             <mesh position={[0.2, 0.15, 0]}>
                <boxGeometry args={[0.05, 0.2, 0.02]} />
                <meshStandardMaterial color="#ff69b4" />
            </mesh>
             <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[0.05, 0.2, 0.02]} />
                <meshStandardMaterial color="#ff69b4" />
            </mesh>
            {/* Dot */}
            <mesh position={[0, -0.4, 0]}>
                <sphereGeometry args={[0.08]} />
                <meshStandardMaterial color="#ff69b4" />
            </mesh>
         </group>

         {/* Text hint */}
         <mesh position={[0, 0.95, 0.04]} rotation={[0, 0, 0.05]}>
             <boxGeometry args={[0.3, 0.08, 0.02]} />
             <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

// --- Photo Component ---
const PhotoFrame = ({ url, position = [2, 2, 0], rotation = [0, -0.5, 0] }: any) => {
  // Use a fallback URL if no local image is found to prevent crash.
  // Note: We use a try/catch style logic by relying on the ErrorBoundary above this component.
  const texture = useLoader(THREE.TextureLoader, url);

  return (
    <group position={position} rotation={rotation}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
        {/* Frame - Resized for Portrait Photo (Tagi) */}
        <mesh castShadow receiveShadow>
            <boxGeometry args={[1.5, 2.0, 0.05]} />
            <meshStandardMaterial color="#fff0f5" roughness={0.4} metalness={0.1} />
        </mesh>
        
        {/* The Photo - Resized to 1.2 x 1.6 (3:4 Ratio) */}
        <mesh position={[0, 0.1, 0.03]}>
            <planeGeometry args={[1.2, 1.6]} /> 
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        {/* Shine/Glass reflection hint */}
        <mesh position={[0, 0.1, 0.035]}>
             <planeGeometry args={[1.2, 1.6]} />
             <meshPhysicalMaterial 
                color="white" 
                transmission={0.9} 
                opacity={0.3} 
                roughness={0} 
                clearcoat={1} 
                transparent 
             />
        </mesh>
        
        {/* Decorative Tape/Clip */}
        <mesh position={[0, 0.95, 0.04]} rotation={[0, 0, 0.05]}>
             <boxGeometry args={[0.3, 0.08, 0.02]} />
             <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
};

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

const ExplodingTreeLayer = ({ scale, position, color }: { scale: number; position: [number, number, number]; color: string }) => {
  const count = 1500; 
  const { gestureRef, isTracking } = useHandTracking();
  
  // Store initial "Tree" positions and current dynamic positions
  const { initialPositions, randomDirections, sizes } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const dir = new Float32Array(count * 3);
    const s = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        // Tree Shape Logic
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

        // Explosion Direction (Normalized vector away from center + noise)
        const dist = Math.sqrt(x*x + y*y + z*z) + 0.1;
        dir[i * 3] = (x / dist) * (1 + Math.random());
        dir[i * 3 + 1] = (y / dist) * (1 + Math.random()) + (Math.random() - 0.5); // Add some vertical chaos
        dir[i * 3 + 2] = (z / dist) * (1 + Math.random());

        s[i] = Math.random();
    }
    return { initialPositions: p, randomDirections: dir, sizes: s };
  }, [count, scale]);

  const pointsRef = useRef<THREE.Points>(null);
  
  // Create a working array for current positions to avoid re-creating Float32Array every frame
  const currentPositions = useMemo(() => new Float32Array(initialPositions), [initialPositions]);

  useFrame((state) => {
     if (!pointsRef.current) return;
     
     // Check Gesture
     // Open = Explode
     // Closed (or none) = Gather
     const isExploding = isTracking && gestureRef.current === 'open';

     const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
     
     for(let i = 0; i < count; i++) {
         const idx = i * 3;
         
         let tx, ty, tz;

         if (isExploding) {
             // Target is far away based on random direction
             // Expansion factor
             const expansion = 8.0; 
             tx = initialPositions[idx] + randomDirections[idx] * expansion;
             ty = initialPositions[idx+1] + randomDirections[idx+1] * expansion;
             tz = initialPositions[idx+2] + randomDirections[idx+2] * expansion;
             
             // Move fast towards explosion (Increased speed from 0.05 to 0.15)
             positions[idx] += (tx - positions[idx]) * 0.15;
             positions[idx+1] += (ty - positions[idx+1]) * 0.15;
             positions[idx+2] += (tz - positions[idx+2]) * 0.15;
         } else {
             // Target is original tree position
             tx = initialPositions[idx];
             ty = initialPositions[idx+1];
             tz = initialPositions[idx+2];

             // Move smoothly back to tree shape (Increased speed from 0.1 to 0.25)
             // Using a spring-like ease
             positions[idx] += (tx - positions[idx]) * 0.25;
             positions[idx+1] += (ty - positions[idx+1]) * 0.25;
             positions[idx+2] += (tz - positions[idx+2]) * 0.25;
         }
     }
     
     pointsRef.current.geometry.attributes.position.needsUpdate = true;

     // Twinkle effect
     const material = pointsRef.current.material as THREE.PointsMaterial;
     material.size = 0.06 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
  });

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute 
            attach="attributes-position" 
            count={count} 
            array={currentPositions} 
            itemSize={3} 
            usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.06} 
        color={color} 
        transparent 
        opacity={0.8} 
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
  const { handPositionRef, gestureRef, isTracking } = useHandTracking();
  
  // 1. Ambient Floating Particles
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 15,
      y: (Math.random() - 0.5) * 15,
      z: (Math.random() - 0.5) * 10,
      vx: 0, vy: 0, vz: 0,
      s: Math.random() * 0.5 + 0.5,
      originalX: (Math.random() - 0.5) * 15, // Remember roughly where they belong
      originalY: (Math.random() - 0.5) * 15,
      originalZ: (Math.random() - 0.5) * 10,
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
     
     const isExploding = isTracking && gestureRef.current === 'open';

     // --- Determine Target Position (Hand or Mouse) ---
     const handPos = handPositionRef.current;
     if (isTracking && handPos) {
         const ndcX = (1 - handPos.x) * 2 - 1; 
         const ndcY = -(handPos.y * 2 - 1);
         xTarget = (ndcX * viewport.width) / 2;
         yTarget = (ndcY * viewport.height) / 2;
     } else {
         xTarget = (state.pointer.x * viewport.width) / 2;
         yTarget = (state.pointer.y * viewport.height) / 2;
     }

     // --- Emit Trail ---
     const dxTarget = xTarget - lastTargetPos.current.x;
     const dyTarget = yTarget - lastTargetPos.current.y;
     const distTarget = Math.sqrt(dxTarget*dxTarget + dyTarget*dyTarget);
     
     if (distTarget > 0.1) {
         const idx = currentTrailIdx.current;
         trailData[idx].active = true;
         trailData[idx].life = 1.0;
         trailData[idx].x = xTarget;
         trailData[idx].y = yTarget;
         trailData[idx].z = zTarget;
         trailData[idx].vx = (Math.random() - 0.5) * 0.1;
         trailData[idx].vy = (Math.random() - 0.5) * 0.1;
         trailData[idx].vz = (Math.random() - 0.5) * 0.1;
         currentTrailIdx.current = (currentTrailIdx.current + 1) % trailCount;
         lastTargetPos.current = { x: xTarget, y: yTarget };
     }

     // --- Update Ambient Particles ---
     particles.forEach((p, i) => {
        let dx, dy, dz;

        if (isExploding) {
             // Explosive force outwards from center (0,0,0)
             dx = p.x; 
             dy = p.y;
             dz = p.z;
             const distToCenter = Math.sqrt(dx*dx + dy*dy + dz*dz) + 0.1;
             
             // Push away
             p.vx += (dx / distToCenter) * 0.05;
             p.vy += (dy / distToCenter) * 0.05;
             p.vz += (dz / distToCenter) * 0.05;
        } else {
             // Normal Behavior: Attracted to Hand/Mouse
             dx = xTarget - p.x;
             dy = yTarget - p.y;
             dz = zTarget - p.z;
             const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
             const force = Math.max(0, (6 - dist) / 6); 
             if (force > 0) {
                p.vx += dx * 0.03 * force;
                p.vy += dy * 0.03 * force;
                p.vz += dz * 0.03 * force;
             }
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
        if (Math.abs(p.x) > 15) p.vx -= p.x * 0.01;
        if (Math.abs(p.y) > 15) p.vy -= p.y * 0.01;
        if (Math.abs(p.z) > 10) p.vz -= p.z * 0.01;

        dummy.position.set(p.x, p.y, p.z);
        const scale = p.s * (isExploding ? 2.0 : 0.5 + Math.random()); 
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
             p.life -= 0.02;
             if (p.life <= 0) p.active = false;
             
             p.x += p.vx;
             p.y += p.vy;
             p.z += p.vz;
             p.y -= 0.02;

             dummy.position.set(p.x, p.y, p.z);
             dummy.scale.setScalar(p.life * 0.8);
             dummy.rotation.set(p.life * 5, p.life * 5, 0);
         }
         dummy.updateMatrix();
         trailMesh.current.setMatrixAt(i, dummy.matrix);
     });
     trailMesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </instancedMesh>
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

  // Construct safe path for the image
  // This handles cases where import.meta.env might not be fully populated in all environments
  const meta = import.meta as any;
  const baseUrl = (meta.env && meta.env.BASE_URL) ? meta.env.BASE_URL : '/';
  // Ensure we don't end up with // if base is just /
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const photoUrl = `${cleanBase}tagi.jpg`;

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

        {/* Dynamic Exploding Tree Layers */}
        <ExplodingTreeLayer position={[0, -1.0, 0]} scale={2.8} color={colors.leaf} />
        <ExplodingTreeLayer position={[0, 0.2, 0]} scale={2.4} color={colors.leaf} />
        <ExplodingTreeLayer position={[0, 1.4, 0]} scale={2.0} color={colors.leaf} />
        <ExplodingTreeLayer position={[0, 2.5, 0]} scale={1.5} color={colors.leaf} />
        <ExplodingTreeLayer position={[0, 3.4, 0]} scale={1.0} color={colors.leaf} />
        <ExplodingTreeLayer position={[0, 4.0, 0]} scale={0.6} color={colors.leaf} />

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

        {/* Top Star */}
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
                ior={2.4} 
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
      
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -2.5, 0]}>
          <circleGeometry args={[5, 32]} />
          <meshBasicMaterial color={colors.leaf} transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Floating Photo Frame - Using Safe Absolute Path */}
      <ErrorBoundary fallback={<PhotoPlaceholder position={[2.2, 2.5, 1.8]} rotation={[0, -0.6, 0]} />}>
          <Suspense fallback={<PhotoPlaceholder position={[2.2, 2.5, 1.8]} rotation={[0, -0.6, 0]} />}>
             <PhotoFrame 
                url={photoUrl} 
                position={[2.2, 2.5, 1.8]} 
                rotation={[0, -0.6, 0]} 
            />
          </Suspense>
      </ErrorBoundary>

      <InteractiveParticles count={250} color={colors.light} />
      
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
