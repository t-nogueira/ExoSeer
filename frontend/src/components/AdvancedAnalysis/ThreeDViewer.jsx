import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '../ui/button';
import { RotateCcw, ZoomIn, Move3D } from 'lucide-react';

// Star component with realistic rendering
const Star = ({ data, position = [0, 0, 0], onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  const starColor = data.stellarTemp > 6000 ? '#87CEEB' : '#FFA500';
  const starRadius = data.stellarRadius * 0.5; // Scale for visibility

  return (
    <group position={position}>
      {/* Star mesh with corona */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <sphereGeometry args={[starRadius, 32, 32]} />
        <meshStandardMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Corona effect */}
      <mesh position={position}>
        <sphereGeometry args={[starRadius * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.1}
        />
      </mesh>
      
      {/* Stellar wind particles */}
      {Array.from({length: 20}, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 0.314) * starRadius * 2,
            Math.cos(i * 0.314) * starRadius * 2,
            Math.sin(i * 0.628) * starRadius * 0.5
          ]}
        >
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshBasicMaterial color="yellow" opacity={0.6} transparent />
        </mesh>
      ))}
      
      {hovered && (
        <Html position={[0, starRadius + 1, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
            <div className="text-yellow-300">{data.stellarTemp}K</div>
            <div>{data.stellarRadius.toFixed(2)} R☉</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Planet component with atmosphere and surface features
const Planet = ({ data, position, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const planetRadius = Math.max(0.1, data.planetRadius * 0.1); // Scale for visibility

  return (
    <group position={position}>
      {/* Planet surface */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <sphereGeometry args={[planetRadius, 24, 24]} />
        <meshStandardMaterial
          color={data.planetColor}
          roughness={data.planetType === 'Rocky' ? 0.8 : 0.2}
          metalness={data.planetType === 'Rocky' ? 0.1 : 0.0}
        />
      </mesh>
      
      {/* Atmosphere if applicable */}
      {data.atmosphereThickness > 0.2 && (
        <mesh position={position}>
          <sphereGeometry args={[planetRadius * (1 + data.atmosphereThickness * 0.5), 16, 16]} />
          <meshBasicMaterial
            color="lightblue"
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Cloud layer for gas giants */}
      {data.planetType === 'Gas Giant' && (
        <mesh position={position}>
          <sphereGeometry args={[planetRadius * 1.05, 16, 16]} />
          <meshBasicMaterial
            color="white"
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
      
      {hovered && (
        <Html position={[0, planetRadius + 0.5, 0]} center>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
            <div className="text-cyan-300">{data.planetType}</div>
            <div>{data.planetRadius.toFixed(2)} R⊕</div>
            <div>{Math.round(data.equilibriumTemp)} K</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Orbital mechanics visualization
const OrbitVisualization = ({ data }) => {
  const orbitRadius = data.aOverRs * 0.1; // Scale to fit viewport
  const points = [];
  
  // Generate elliptical orbit points
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    const x = orbitRadius * Math.cos(angle) * (1 - data.eccentricity);
    const y = 0;
    const z = orbitRadius * Math.sin(angle);
    points.push(new THREE.Vector3(x, y, z));
  }

  return (
    <group>
      {/* Orbital path */}
      <Line
        points={points}
        color="emerald"
        lineWidth={2}
        transparent
        opacity={0.6}
      />
      
      {/* Orbital plane grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[orbitRadius * 4, orbitRadius * 4, 20, 20]} />
        <meshBasicMaterial
          color="gray"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
      
      {/* Habitable zone rings */}
      {data.habitableZone && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[data.habitableZone.rinAu * 0.1, data.habitableZone.rinAu * 0.1 + 0.02, 32]} />
            <meshBasicMaterial color="green" transparent opacity={0.3} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[data.habitableZone.routAu * 0.1, data.habitableZone.routAu * 0.1 + 0.02, 32]} />
            <meshBasicMaterial color="green" transparent opacity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Transit geometry visualization
const TransitGeometry = ({ data }) => {
  const starRadius = data.stellarRadius * 0.5;
  const planetRadius = Math.max(0.05, data.planetRadius * 0.1);
  
  return (
    <group>
      {/* Line of sight ray */}
      <Line
        points={[[-10, 0, 0], [10, 0, 0]]}
        color="orange"
        lineWidth={3}
        transparent
        opacity={0.8}
      />
      
      {/* Transit chord */}
      <Line
        points={[
          [-starRadius, data.impactParam * starRadius, 0],
          [starRadius, data.impactParam * starRadius, 0]
        ]}
        color="red"
        lineWidth={4}
        transparent
        opacity={0.9}
      />
      
      {/* Impact parameter line */}
      <Line
        points={[[0, 0, 0], [0, data.impactParam * starRadius, 0]]}
        color="cyan"
        lineWidth={2}
        transparent
        opacity={0.7}
      />
      
      {/* Transit plane */}
      <mesh position={[0, data.impactParam * starRadius * 0.5, 0]}>
        <planeGeometry args={[starRadius * 3, Math.abs(data.impactParam * starRadius) * 2]} />
        <meshBasicMaterial
          color="red"
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
};

// Controls and information overlay
const Controls = ({ onReset, data }) => {
  return (
    <div className="absolute top-4 left-4 z-10 space-y-2">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-400/30">
        <h4 className="text-cyan-300 font-mono text-sm mb-2">3D Controls</h4>
        <div className="space-y-1 text-xs text-gray-300">
          <div>• Left click + drag: Rotate</div>
          <div>• Right click + drag: Pan</div>
          <div>• Scroll: Zoom</div>
          <div>• Click objects: Focus</div>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="mt-2 w-full">
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset View
        </Button>
      </div>
      
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-purple-400/30">
        <h4 className="text-purple-300 font-mono text-sm mb-2">System Info</h4>
        <div className="space-y-1 text-xs text-gray-300">
          <div>Transit Depth: {(data.transitDepth * 1000000).toFixed(0)} ppm</div>
          <div>Duration: {data.transitDuration.toFixed(1)} hrs</div>
          <div>Impact Parameter: {data.impactParam.toFixed(3)}</div>
          <div>Inclination: {data.inclination.toFixed(1)}°</div>
        </div>
      </div>
    </div>
  );
};

// Main 3D Viewer component
const ThreeDViewer = ({ systemData, candidate }) => {
  const [focusedObject, setFocusedObject] = useState(null);
  const [showTransitGeometry, setShowTransitGeometry] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const controlsRef = useRef();

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const planetPosition = [
    systemData.aOverRs * 0.1 * Math.cos(systemData.phase * 2 * Math.PI),
    0,
    systemData.aOverRs * 0.1 * Math.sin(systemData.phase * 2 * Math.PI)
  ];

  return (
    <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden border border-gray-700">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #0f1419, #1a202c)' }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="yellow" />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="white" />
        
        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={20}
          minDistance={2}
        />
        
        {/* Star field background */}
        {Array.from({length: 200}, (_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100,
              (Math.random() - 0.5) * 100
            ]}
          >
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshBasicMaterial color="white" />
          </mesh>
        ))}
        
        {/* System components */}
        <Star
          data={systemData}
          position={[0, 0, 0]}
          onClick={() => setFocusedObject('star')}
        />
        
        <Planet
          data={systemData}
          position={planetPosition}
          onClick={() => setFocusedObject('planet')}
        />
        
        <OrbitVisualization data={systemData} />
        
        {showTransitGeometry && (
          <TransitGeometry data={systemData} />
        )}
        
        {/* Labels and annotations */}
        <Text
          position={[0, systemData.stellarRadius * 0.5 + 1, 0]}
          fontSize={0.3}
          color="yellow"
          anchorX="center"
          anchorY="middle"
        >
          {candidate?.host_star || 'Host Star'}
        </Text>
        
        <Text
          position={[planetPosition[0], planetPosition[1] + 0.8, planetPosition[2]]}
          fontSize={0.2}
          color="cyan"
          anchorX="center"
          anchorY="middle"
        >
          {candidate?.name}
        </Text>
      </Canvas>
      
      {/* UI Controls overlay */}
      <Controls onReset={handleReset} data={systemData} />
      
      {/* Bottom control panel */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-400/30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-cyan-300 font-mono text-sm">Visualization Options</h4>
            <div className="flex gap-2">
              <Button
                variant={showTransitGeometry ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTransitGeometry(!showTransitGeometry)}
              >
                Transit Geometry
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-orange-300 font-mono">Orbital:</span>
              <div className="text-white">a = {systemData.semiMajorAxis.toFixed(3)} AU</div>
              <div className="text-gray-300">e = {systemData.eccentricity.toFixed(3)}</div>
            </div>
            <div>
              <span className="text-purple-300 font-mono">Transit:</span>
              <div className="text-white">δ = {(systemData.transitDepth * 1000000).toFixed(0)} ppm</div>
              <div className="text-gray-300">b = {systemData.impactParam.toFixed(3)}</div>
            </div>
            <div>
              <span className="text-green-300 font-mono">Physical:</span>
              <div className="text-white">R_p = {systemData.planetRadius.toFixed(2)} R⊕</div>
              <div className="text-gray-300">T_eq = {Math.round(systemData.equilibriumTemp)} K</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance indicator */}
      <div className="absolute top-4 right-4">
        <div className="bg-green-900/60 text-green-300 px-2 py-1 rounded text-xs font-mono">
          3D Active
        </div>
      </div>
    </div>
  );
};

export default ThreeDViewer;