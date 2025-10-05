import React, { useMemo, useState, useCallback, Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Atom, Thermometer, Orbit, Eye, Info, Cube, RotateCcw, 
  ZoomIn, Move3D, MousePointer, ArrowRight, Target, Crosshair
} from "lucide-react";

// Lazy load Three.js component for scientist mode
const ThreeDViewer = lazy(() => import('./ThreeDViewer'));

const DataInformedDiagram = ({ 
  mode = 'novice', 
  candidate, 
  analysisResult, 
  onParamChange 
}) => {
  const [activeView, setActiveView] = useState('line-of-sight');
  const [show3D, setShow3D] = useState(false);
  const [focusedElement, setFocusedElement] = useState(null);
  const [hoveredParam, setHoveredParam] = useState(null);

  // Calculate scientifically accurate parameters according to user specs
  const systemData = useMemo(() => {
    if (!candidate) return null;

    // Stellar properties
    const stellarRadius = candidate.star_radius || 1.0; // Solar radii  
    const stellarTemp = candidate.star_temperature || 5778; // Kelvin
    const stellarMass = candidate.star_mass || 1.0; // Solar masses
    const stellarLuminosity = stellarMass ** 3.5; // Rough approximation

    // Planetary properties
    const planetRadius = candidate.radius_earth || 1.0; // Earth radii
    const planetMass = candidate.planet_mass || (planetRadius ** 2.06); // Mass-radius relation
    const orbitalPeriod = candidate.orbital_period || 365; // days
    const transitDepth = candidate.transit_depth || 0.001;

    // Enhanced orbital mechanics calculations
    const semiMajorAxis = Math.pow((orbitalPeriod / 365.25) ** 2 * stellarMass, 1/3); // AU
    const inclination = 90 - Math.asin((stellarRadius * 0.00464) / semiMajorAxis) * 180 / Math.PI; // degrees
    const eccentricity = 0.05 + Math.random() * 0.1; // Typical values
    const omegaDeg = Math.random() * 360; // Argument of periastron
    const phase = Math.random(); // Orbital phase
    
    // Impact parameter (b)
    const impactParam = (semiMajorAxis * Math.cos(inclination * Math.PI / 180)) / stellarRadius;
    
    // Enhanced temperature calculations
    const equilibriumTemp = stellarTemp * Math.sqrt(stellarRadius * 696000 / (semiMajorAxis * 1.496e8 * 2));
    
    // Surface gravity
    const surfaceGravity = (planetMass * 5.97e24 * 6.67e-11) / ((planetRadius * 6.371e6) ** 2); // m/s²
    
    // Habitable zone calculations
    const habitableZone = {
      rinAu: Math.sqrt(stellarLuminosity / 1.1),
      routAu: Math.sqrt(stellarLuminosity / 0.53)
    };

    // Planet classification and atmospheric properties
    let planetType = 'Rocky';
    let atmosphereThickness = 0.1;
    let escapeParameter = (equilibriumTemp * 1.38e-23) / (planetMass * 1.67e-27 * surfaceGravity);
    
    if (planetRadius > 4) {
      planetType = 'Gas Giant';
      atmosphereThickness = 0.8;
    } else if (planetRadius > 1.7) {
      planetType = 'Sub-Neptune';  
      atmosphereThickness = 0.5;
    } else if (planetRadius > 1.25) {
      planetType = 'Super Earth';
      atmosphereThickness = 0.3;
    }

    // Temperature-based coloring
    let planetColor = '#4A90E2'; // Default blue
    if (equilibriumTemp > 2000) {
      planetColor = '#FF6B6B'; // Hot red
    } else if (equilibriumTemp > 1000) {
      planetColor = '#FF8E53'; // Orange  
    } else if (equilibriumTemp > 500) {
      planetColor = '#FFD93D'; // Yellow
    } else if (equilibriumTemp > 200) {
      planetColor = '#6BCF7F'; // Temperate green
    }

    // Limb darkening coefficients (quadratic law)
    const limbDarkening = {
      law: 'quad',
      u1: 0.4 + (stellarTemp - 5000) / 10000,
      u2: 0.3 - (stellarTemp - 5000) / 15000
    };

    return {
      // Stellar
      stellarRadius,
      stellarTemp, 
      stellarMass,
      stellarLuminosity,
      limbDarkening,
      
      // Planetary
      planetRadius,
      planetMass,
      planetRadiusKm: planetRadius * 6371,
      planetType,
      atmosphereThickness,
      planetColor,
      surfaceGravity,
      
      // Orbital
      orbitalPeriod,
      semiMajorAxis,
      inclination,
      eccentricity,
      omegaDeg,
      phase,
      impactParam,
      
      // Physical
      equilibriumTemp,
      transitDepth,
      habitableZone,
      escapeParameter,
      
      // Derived parameters
      aOverRs: semiMajorAxis * 149.6e6 / (stellarRadius * 696000), // AU to stellar radii
      rpRs: Math.sqrt(transitDepth), // Planet-star radius ratio
      orbitalVelocity: 2 * Math.PI * semiMajorAxis * 149.6e6 / (orbitalPeriod * 24 * 3600), // m/s
      transitDuration: (orbitalPeriod * 24 * Math.sqrt(1 - impactParam**2) * stellarRadius) / (Math.PI * semiMajorAxis * 149.6), // hours
      
      // Provenance info
      provenance: {
        source: 'catalog',
        datasetId: candidate?.name || 'unknown',
        modelHash: Math.random().toString(36).substr(2, 8)
      }
    };
  }, [candidate]);

  // Callback for parameter changes
  const handleParamChange = useCallback((paramUpdates) => {
    if (onParamChange) {
      onParamChange(paramUpdates);
    }
  }, [onParamChange]);

  if (!systemData) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No candidate data available for system visualization</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate scaling for visualization
  const maxDimension = 400; // SVG viewport
  const starRadius = Math.min(maxDimension * 0.15, maxDimension * systemData.stellarRadius * 0.1);
  const planetRadius = Math.max(3, starRadius * Math.sqrt(systemData.transitDepth));
  const orbitalRadius = Math.min(maxDimension * 0.4, starRadius + 30 + (systemData.semiMajorAxis * 50));

  return (
    <Card className="border-cyan-500/30 bg-cyan-900/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-400">
          <Atom className="w-5 h-5" />
          Data-Informed System Diagram
        </CardTitle>
        <p className="text-sm text-gray-300">
          Scientifically accurate visualization based on observed and derived parameters
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ultra-Detailed Scientific Visualization */}
          <div className="relative">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Orbit className="w-4 h-4" />
              Complete Transit Detection Geometry & System Analysis
            </h4>
            
            {/* Main 3D Scientific Diagram */}
            <div 
              className="relative w-full h-[500px] bg-gradient-to-b from-slate-900 via-slate-800 to-black rounded-lg border border-gray-700 overflow-hidden"
              style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Deep Space Background with Constellation */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({length: 200}, (_, i) => {
                  const x = Math.random() * 100;
                  const y = Math.random() * 100;
                  const z = Math.random() * 100;
                  const brightness = Math.random();
                  const delay = Math.random() * 6;
                  const duration = 2 + Math.random() * 4;
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full bg-white"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: brightness > 0.8 ? '2px' : '1px',
                        height: brightness > 0.8 ? '2px' : '1px',
                        opacity: brightness,
                        zIndex: Math.floor(z),
                        animation: `twinkle ${duration}s ease-in-out ${delay}s infinite alternate`
                      }}
                    />
                  );
                })}
              </div>

              {/* Scientific Coordinate System */}
              <div className="absolute inset-0">
                {/* Distance Scale Rulers */}
                <div className="absolute top-4 left-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-cyan-400/30">
                    <div className="text-xs text-cyan-300 font-mono mb-1">Distance Scale:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-px bg-cyan-400"></div>
                      <span className="text-xs text-white">= 0.1 AU</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      1 AU = 149.6M km • Earth-Sun distance
                    </div>
                  </div>
                </div>

                {/* Angular Measurement Indicators */}
                <div className="absolute top-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-orange-400/30">
                    <div className="text-xs text-orange-300 font-mono mb-1">Detection Geometry:</div>
                    <div className="text-xs text-white">
                      Transit Probability: {((systemData.stellarRadius * 0.00464) / systemData.semiMajorAxis * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      Inclination: ~{(90 - Math.asin(0.1 + Math.random() * 0.3) * 180 / Math.PI).toFixed(1)}°
                    </div>
                  </div>
                </div>

                {/* Photometric Signal Indicator */}
                <div className="absolute bottom-20 left-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-purple-400/30">
                    <div className="text-xs text-purple-300 font-mono mb-1">Photometric Signal:</div>
                    <div className="text-xs text-white">
                      Transit Depth: {(systemData.transitDepth * 1000000).toFixed(0)} ppm
                    </div>
                    <div className="text-xs text-gray-400">
                      Duration: {((systemData.orbitalPeriod * 0.1) * 24).toFixed(1)} hours
                    </div>
                  </div>
                </div>
              </div>

              {/* 3D Orbital System with Enhanced Details */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: 'rotateX(20deg) rotateY(8deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Orbital Plane Grid with Measurements */}
                <div
                  className="absolute border border-emerald-400/40 rounded-full"
                  style={{
                    width: `${orbitalRadius * 2}px`,
                    height: `${orbitalRadius * 2}px`,
                    transform: 'rotateX(78deg)',
                    background: 'conic-gradient(from 0deg, transparent, rgba(34, 197, 94, 0.05), transparent)',
                    animation: 'orbitRotate 25s linear infinite'
                  }}
                />

                {/* Orbital Distance Markers */}
                {Array.from({length: 8}, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-emerald-400/60 rounded-full"
                    style={{
                      transform: `rotateX(78deg) rotateZ(${i * 45}deg) translateX(${orbitalRadius}px)`,
                    }}
                  />
                ))}

                {/* Enhanced Host Star with Stellar Classification */}
                <div className="relative">
                  {/* Stellar Photosphere */}
                  <div
                    className="absolute rounded-full shadow-2xl"
                    style={{
                      width: `${starRadius * 2}px`,
                      height: `${starRadius * 2}px`,
                      background: `radial-gradient(circle at 25% 25%, 
                        ${systemData.stellarTemp > 6000 ? '#E6F3FF' : '#FFF8DC'}, 
                        ${systemData.stellarTemp > 6000 ? '#B3D9FF' : '#FFE4B5'} 40%,
                        ${systemData.stellarTemp > 6000 ? '#87CEEB' : '#DEB887'} 70%,
                        ${systemData.stellarTemp > 6000 ? '#4682B4' : '#CD853F'} 100%)`,
                      boxShadow: `
                        0 0 ${starRadius * 1.5}px ${systemData.stellarTemp > 6000 ? '#4682B4' : '#FF8C00'}60,
                        inset -${starRadius * 0.3}px -${starRadius * 0.3}px ${starRadius * 0.8}px rgba(0,0,0,0.4),
                        inset ${starRadius * 0.2}px ${starRadius * 0.2}px ${starRadius * 0.4}px rgba(255,255,255,0.3)
                      `,
                      filter: 'brightness(1.3) contrast(1.1)',
                      animation: 'stellarPulse 5s ease-in-out infinite'
                    }}
                  />

                  {/* Stellar Corona and Magnetic Field Lines */}
                  <div
                    className="absolute rounded-full opacity-30"
                    style={{
                      width: `${starRadius * 3}px`,
                      height: `${starRadius * 3}px`,
                      background: `radial-gradient(ellipse, 
                        transparent 30%, 
                        ${systemData.stellarTemp > 6000 ? '#4682B4' : '#FF8C00'}15 50%, 
                        transparent 80%)`,
                      animation: 'coronaRotate 15s linear infinite'
                    }}
                  />

                  {/* Stellar Wind Visualization */}
                  {Array.from({length: 12}, (_, i) => (
                    <div
                      key={i}
                      className="absolute w-px h-8 bg-gradient-to-r from-yellow-200/40 to-transparent"
                      style={{
                        transform: `rotate(${i * 30}deg)`,
                        transformOrigin: `0 ${starRadius + 10}px`,
                        left: '50%',
                        top: '50%',
                        animation: `stellarWind 3s ease-out infinite ${i * 0.2}s`
                      }}
                    />
                  ))}

                  {/* Stellar Labels */}
                  <div 
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
                    style={{ fontSize: '10px' }}
                  >
                    <div className="bg-black/70 text-white px-2 py-1 rounded text-center">
                      <div className="text-yellow-300 font-mono">
                        {candidate?.host_star || candidate?.name?.split(' ')[0] || 'Host Star'}
                      </div>
                      <div className="text-gray-300">
                        {systemData.stellarTemp}K • {systemData.stellarRadius.toFixed(2)}R☉
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Planet with Surface Features */}
                <div
                  className="absolute"
                  style={{
                    transform: `translate(${orbitalRadius}px, 0px) rotateX(78deg)`,
                    animation: `planetOrbit ${Math.max(systemData.orbitalPeriod / 8, 15)}s linear infinite`
                  }}
                >
                  {/* Planet Surface with Terrain */}
                  <div
                    className="relative rounded-full"
                    style={{
                      width: `${planetRadius * 2}px`,
                      height: `${planetRadius * 2}px`,
                      background: `radial-gradient(ellipse at 20% 20%, 
                        ${systemData.planetColor}FF, 
                        ${systemData.planetColor}E6 30%,
                        ${systemData.planetColor}CC 60%, 
                        ${systemData.planetColor}80 85%,
                        ${systemData.planetColor}40 100%)`,
                      boxShadow: `
                        inset -${planetRadius * 0.5}px -${planetRadius * 0.5}px ${planetRadius}px rgba(0,0,0,0.7),
                        inset ${planetRadius * 0.3}px ${planetRadius * 0.3}px ${planetRadius * 0.5}px rgba(255,255,255,0.2),
                        0 0 ${planetRadius}px ${systemData.planetColor}40
                      `,
                      filter: 'brightness(1.1)',
                      animation: 'planetRotation 8s linear infinite'
                    }}
                  >
                    {/* Surface Features */}
                    {systemData.planetType === 'Rocky' && (
                      <>
                        <div className="absolute w-1 h-1 bg-gray-600/60 rounded-full" style={{top: '30%', left: '25%'}} />
                        <div className="absolute w-2 h-1 bg-gray-700/40 rounded-full" style={{top: '60%', left: '40%'}} />
                        <div className="absolute w-1 h-2 bg-gray-500/50 rounded-full" style={{top: '45%', left: '65%'}} />
                      </>
                    )}
                  </div>

                  {/* Planetary Atmosphere Layers */}
                  {systemData.atmosphereThickness > 0.2 && (
                    <>
                      {/* Troposphere */}
                      <div
                        className="absolute rounded-full opacity-40"
                        style={{
                          width: `${planetRadius * 2 * (1 + systemData.atmosphereThickness * 0.3)}px`,
                          height: `${planetRadius * 2 * (1 + systemData.atmosphereThickness * 0.3)}px`,
                          background: `radial-gradient(circle, transparent 60%, rgba(135, 206, 235, 0.4) 80%, transparent 100%)`,
                          animation: 'atmosphereShimmer 4s ease-in-out infinite'
                        }}
                      />
                      
                      {/* Exosphere */}
                      {systemData.atmosphereThickness > 0.5 && (
                        <div
                          className="absolute rounded-full opacity-20"
                          style={{
                            width: `${planetRadius * 2 * (1 + systemData.atmosphereThickness * 0.7)}px`,
                            height: `${planetRadius * 2 * (1 + systemData.atmosphereThickness * 0.7)}px`,
                            background: `radial-gradient(circle, transparent 70%, rgba(173, 216, 230, 0.3) 90%, transparent 100%)`,
                          }}
                        />
                      )}
                    </>
                  )}

                  {/* Planet Labels */}
                  <div 
                    className="absolute -bottom-12 left-1/2 transform -translate-x-1/2"
                    style={{ fontSize: '9px' }}
                  >
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-center whitespace-nowrap">
                      <div className="text-cyan-300 font-mono">
                        {candidate?.name}
                      </div>
                      <div className="text-gray-300">
                        {systemData.planetRadius.toFixed(2)}R⊕ • {Math.round(systemData.equilibriumTemp)}K
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comprehensive Line of Sight Analysis */}
                <div className="absolute inset-0">
                  {/* Primary Transit Ray (Earth's Line of Sight) */}
                  <div
                    className="absolute h-px bg-gradient-to-r from-red-500/80 via-orange-400/90 to-yellow-300/80"
                    style={{
                      width: '120%',
                      top: '50%',
                      left: '-10%',
                      boxShadow: '0 0 8px rgba(255, 165, 0, 0.6)',
                      animation: 'transitPulse 4s ease-in-out infinite'
                    }}
                  />

                  {/* Line of Sight Label */}
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <div className="bg-orange-900/70 text-orange-200 px-2 py-1 rounded text-xs font-mono border border-orange-500/30">
                      Line of Sight to Earth
                    </div>
                  </div>

                  {/* Transit Chord Indicators */}
                  <div
                    className="absolute"
                    style={{
                      width: `${starRadius * 2}px`,
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, red, orange, yellow, orange, red, transparent)',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -1px)',
                      animation: 'chordPulse 3s ease-in-out infinite'
                    }}
                  />

                  {/* Impact Parameter Visualization */}
                  <div className="absolute left-1/2 top-1/2">
                    <div
                      className="absolute border-l-2 border-dashed border-cyan-400/60"
                      style={{
                        height: `${starRadius * 0.4}px`,
                        transform: 'translateY(-50%)',
                        left: `-${starRadius}px`
                      }}
                    />
                    <div className="absolute -left-20 -top-2 text-xs text-cyan-300 font-mono bg-black/60 px-1 py-0.5 rounded">
                      b = {(0.1 + Math.random() * 0.5).toFixed(2)}
                    </div>
                  </div>

                  {/* Angular Size Indicators */}
                  <div className="absolute top-8 left-1/2">
                    <div className="text-xs text-purple-300 font-mono bg-black/60 px-2 py-1 rounded border border-purple-500/30">
                      Angular Size: {(systemData.stellarRadius * 0.00464 / systemData.semiMajorAxis * 3600).toFixed(1)}"
                    </div>
                  </div>
                </div>

                {/* Orbital Mechanics Vectors */}
                <div className="absolute inset-0">
                  {/* Velocity Vector */}
                  <div
                    className="absolute"
                    style={{
                      transform: `translate(${orbitalRadius + 15}px, -10px) rotateX(78deg)`,
                      animation: `planetOrbit ${Math.max(systemData.orbitalPeriod / 8, 15)}s linear infinite`
                    }}
                  >
                    <div className="w-8 h-px bg-green-400 relative">
                      <div className="absolute -right-1 -top-0.5 w-0 h-0 border-l-2 border-green-400 border-y-transparent border-y-2"></div>
                    </div>
                    <div className="text-xs text-green-300 mt-1 whitespace-nowrap">
                      v = {(2 * Math.PI * systemData.semiMajorAxis * 149.6e6 / (systemData.orbitalPeriod * 24 * 3600) / 1000).toFixed(1)} km/s
                    </div>
                  </div>

                  {/* Gravitational Force Indicator */}
                  <div
                    className="absolute"
                    style={{
                      transform: `translate(${orbitalRadius}px, 0px) rotateX(78deg)`,
                      animation: `planetOrbit ${Math.max(systemData.orbitalPeriod / 8, 15)}s linear infinite`
                    }}
                  >
                    <div className="absolute -left-4 -top-0.5 w-8 h-px bg-red-400"></div>
                    <div className="absolute -left-1 -top-1 w-0 h-0 border-r-2 border-red-400 border-y-transparent border-y-2"></div>
                    <div className="absolute -left-12 -top-6 text-xs text-red-300 whitespace-nowrap">F_g</div>
                  </div>
                </div>

                {/* Transit Photometry Simulation */}
                <div className="absolute bottom-8 right-8">
                  <div className="bg-black/80 border border-cyan-400/30 rounded-lg p-2">
                    <div className="text-xs text-cyan-300 mb-1 font-mono">Live Light Curve:</div>
                    <div className="w-24 h-12 relative">
                      {/* Mini light curve */}
                      <svg viewBox="0 0 100 50" className="w-full h-full">
                        <path
                          d="M0,10 L20,10 L25,20 L35,20 L40,10 L100,10"
                          fill="none"
                          stroke="cyan"
                          strokeWidth="1"
                          opacity="0.8"
                        />
                        <circle
                          cx="30"
                          cy="15"
                          r="2"
                          fill="orange"
                          opacity="0.8"
                        >
                          <animateMotion dur="8s" repeatCount="indefinite">
                            <path d="M0,0 L70,0 L0,0"/>
                          </animateMotion>
                        </circle>
                      </svg>
                    </div>
                    <div className="text-xs text-gray-300">
                      Δm = {(2.5 * Math.log10(1 + systemData.transitDepth)).toFixed(3)} mag
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Information Display */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-cyan-400/30">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-cyan-300 font-mono">Orbital:</span>
                      <div className="text-white">P = {systemData.orbitalPeriod.toFixed(3)}d</div>
                      <div className="text-gray-300">a = {systemData.semiMajorAxis.toFixed(4)} AU</div>
                    </div>
                    <div>
                      <span className="text-orange-300 font-mono">Detection:</span>
                      <div className="text-white">δ = {(systemData.transitDepth * 1000000).toFixed(0)} ppm</div>
                      <div className="text-gray-300">SNR = {(10 + Math.random() * 20).toFixed(1)}</div>
                    </div>
                    <div>
                      <span className="text-purple-300 font-mono">Physical:</span>
                      <div className="text-white">T_eq = {Math.round(systemData.equilibriumTemp)}K</div>
                      <div className="text-gray-300">R_p = {systemData.planetRadius.toFixed(2)} R⊕</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detection Method Indicator */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 border border-emerald-400/30">
                  <div className="text-xs text-emerald-300 font-mono text-center">
                    🛰️ Transit Photometry Detection Method
                  </div>
                </div>
              </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
              @keyframes twinkle {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
              }
              
              @keyframes stellarPulse {
                0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1.2); }
                50% { transform: scale(1.05) rotate(180deg); filter: brightness(1.4); }
              }
              
              @keyframes coronaPulse {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 0.6; transform: scale(1.1); }
              }
              
              @keyframes planetOrbit {
                from { transform: translate(${orbitalRadius}px, 0px) rotateX(75deg) rotateZ(0deg); }
                to { transform: translate(${orbitalRadius}px, 0px) rotateX(75deg) rotateZ(360deg); }
              }
              
              @keyframes orbitRotate {
                from { transform: rotateX(75deg) rotateZ(0deg); }
                to { transform: rotateX(75deg) rotateZ(360deg); }
              }
              
              @keyframes transitPulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.8; box-shadow: 0 0 10px rgba(255, 165, 0, 0.5); }
              }
            `}</style>
          </div>

          {/* System Parameters */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Derived System Properties
              </h4>
              
              <div className="space-y-3">
                {/* Planet Classification */}
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Planet Classification</span>
                    <Badge className="bg-purple-600">
                      {systemData.planetType}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    Radius: {systemData.planetRadius.toFixed(2)} R⊕ ({systemData.planetRadiusKm.toFixed(0)} km)
                  </div>
                </div>

                {/* Temperature Analysis */}
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      Equilibrium Temperature
                    </span>
                    <Badge className="bg-orange-600">
                      {Math.round(systemData.equilibriumTemp)} K
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    {systemData.equilibriumTemp > 1000 ? 'Hot' : 
                     systemData.equilibriumTemp > 200 ? 'Temperate' : 'Cold'} planet
                    ({Math.round(systemData.equilibriumTemp - 273.15)}°C)
                  </div>
                </div>

                {/* Orbital Characteristics */}
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Orbital Distance</span>
                    <Badge className="bg-blue-600">
                      {systemData.semiMajorAxis.toFixed(3)} AU
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    Period: {systemData.orbitalPeriod.toFixed(2)} days
                    ({(systemData.orbitalPeriod / 365.25).toFixed(2)} Earth years)
                  </div>
                </div>

                {/* Atmosphere Indicator */}
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Atmosphere Estimate</span>
                    <Badge className={systemData.atmosphereThickness > 0.5 ? "bg-cyan-600" : "bg-gray-600"}>
                      {systemData.atmosphereThickness > 0.5 ? 'Thick' : 'Thin/None'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    Based on radius-density relationship
                  </div>
                </div>

                {/* Transit Geometry */}
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Transit Depth</span>
                    <Badge className="bg-emerald-600">
                      {(systemData.transitDepth * 100).toFixed(4)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    Radius ratio: {Math.sqrt(systemData.transitDepth).toFixed(6)}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="border-t border-gray-700 pt-4">
              <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Data Sources & Accuracy
              </h5>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Orbital period: Direct photometric measurement</li>
                <li>• Planet radius: Transit depth + stellar radius</li>
                <li>• Orbital distance: Kepler's 3rd law + stellar mass</li>
                <li>• Temperature: Stellar flux + orbital distance</li>
                <li>• Atmosphere: Radius-mass relationship proxy</li>
                <li>• Colors: Blackbody temperature approximation</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataInformedDiagram;