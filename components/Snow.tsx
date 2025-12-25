import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Snow = ({ count = 200 }: { count?: number }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  // Random initial positions and speeds
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -5 + Math.random() * 10;
      const yFactor = -5 + Math.random() * 10;
      const zFactor = -5 + Math.random() * 10;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  // Dummy object to handle instance positioning
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    particles.forEach((particle, i) => {
      // Update Y position (falling)
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      
      // Calculate position
      // We wrap it around a bounding box
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      // Update internal state
      particle.mx += (state.mouse.x * 10 - particle.mx) * 0.02;
      particle.my += (state.mouse.y * 10 - 1 - particle.my) * 0.02;

      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      
      // Reset if too low (simple reset)
      if (dummy.position.y < -10) {
          particle.t = Math.random() * 100; // Reset time
          // Re-randomize slightly to avoid patterns
          dummy.position.y = 10;
      }
      
      dummy.scale.setScalar(s * 0.5 + 0.5); // Pulse size slightly
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      
      // @ts-ignore
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.05, 0]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} opacity={0.8} transparent />
    </instancedMesh>
  );
};
