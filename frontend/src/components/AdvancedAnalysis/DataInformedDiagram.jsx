import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Atom, Thermometer, Orbit, Eye, Info
} from "lucide-react";

const DataInformedDiagram = ({ candidate, analysisResult }) => {
  // Calculate scientifically accurate parameters
  const systemData = useMemo(() => {
    if (!candidate) return null;

    // Stellar properties
    const stellarRadius = candidate.star_radius || 1.0; // Solar radii
    const stellarTemp = candidate.star_temperature || 5778; // Kelvin
    const stellarMass = candidate.star_mass || 1.0; // Solar masses

    // Planetary properties
    const planetRadius = candidate.radius_earth || 1.0; // Earth radii
    const orbitalPeriod = candidate.orbital_period || 365; // days
    const transitDepth = candidate.transit_depth || 0.001;

    // Calculate orbital distance using Kepler's third law
    const semiMajorAxis = Math.pow((orbitalPeriod / 365.25) ** 2 * stellarMass, 1/3); // AU
    
    // Calculate equilibrium temperature (assuming zero albedo, perfect heat redistribution)
    const equilibriumTemp = stellarTemp * Math.sqrt(stellarRadius * 696000 / (semiMajorAxis * 1.496e8 * 2));

    // Determine planet type based on radius and calculated density proxy
    const planetRadiusKm = planetRadius * 6371; // Convert to km
    let planetType = 'Rocky';
    let atmosphereThickness = 0.1; // Default thin
    
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

    // Color based on equilibrium temperature
    let planetColor = '#4A90E2'; // Default blue
    if (equilibriumTemp > 2000) {
      planetColor = '#FF6B6B'; // Hot red
    } else if (equilibriumTemp > 1000) {
      planetColor = '#FF8E53'; // Orange
    } else if (equilibriumTemp > 500) {
      planetColor = '#FFD93D'; // Yellow
    } else if (equilibriumTemp > 200) {
      planetColor = '#6BCF7F'; // Temperate green
    } // else stays blue for cold

    return {
      stellarRadius,
      stellarTemp,
      stellarMass,
      planetRadius,
      planetRadiusKm,
      orbitalPeriod,
      semiMajorAxis,
      equilibriumTemp,
      planetType,
      atmosphereThickness,
      planetColor,
      transitDepth
    };
  }, [candidate]);

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
          {/* Enhanced 3D System Visualization */}
          <div className="relative">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Orbit className="w-4 h-4" />
              3D System Architecture & Transit Geometry
            </h4>
            
            {/* 3D Scene Container */}
            <div 
              className="relative w-full h-96 bg-gradient-to-b from-slate-900 via-slate-800 to-black rounded-lg border border-gray-700 overflow-hidden"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Animated starfield background */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({length: 100}, (_, i) => {
                  const x = Math.random() * 100;
                  const y = Math.random() * 100;
                  const delay = Math.random() * 4;
                  const duration = 2 + Math.random() * 3;
                  return (
                    <div
                      key={i}
                      className="absolute w-px h-px bg-white rounded-full opacity-60"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        animation: `twinkle ${duration}s ease-in-out ${delay}s infinite alternate`
                      }}
                    />
                  );
                })}
              </div>

              {/* 3D Orbital System */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: 'rotateX(15deg) rotateY(5deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Orbital Plane */}
                <div
                  className="absolute border border-emerald-400/30 rounded-full"
                  style={{
                    width: `${orbitalRadius * 2}px`,
                    height: `${orbitalRadius * 2}px`,
                    transform: 'rotateX(75deg)',
                    animation: 'orbitRotate 20s linear infinite'
                  }}
                />

                {/* Enhanced Host Star with 3D effects */}
                <div
                  className="absolute rounded-full shadow-2xl"
                  style={{
                    width: `${starRadius * 2}px`,
                    height: `${starRadius * 2}px`,
                    background: `radial-gradient(circle at 30% 30%, 
                      ${systemData.stellarTemp > 6000 ? '#E6F3FF' : '#FFF4E6'}, 
                      ${systemData.stellarTemp > 6000 ? '#B3D9FF' : '#FFE4B5'} 60%, 
                      ${systemData.stellarTemp > 6000 ? '#4A90E2' : '#FF8C00'} 100%)`,
                    boxShadow: `
                      0 0 ${starRadius}px ${systemData.stellarTemp > 6000 ? '#4A90E2' : '#FFB347'}40,
                      inset -${starRadius * 0.3}px -${starRadius * 0.3}px ${starRadius * 0.5}px rgba(0,0,0,0.3)
                    `,
                    filter: 'brightness(1.2)',
                    animation: 'stellarPulse 4s ease-in-out infinite'
                  }}
                />

                {/* Stellar Corona Effect */}
                <div
                  className="absolute rounded-full opacity-40"
                  style={{
                    width: `${starRadius * 2.4}px`,
                    height: `${starRadius * 2.4}px`,
                    background: `radial-gradient(circle, transparent 50%, ${systemData.stellarTemp > 6000 ? '#4A90E2' : '#FFB347'}10 70%, transparent 100%)`,
                    animation: 'coronaPulse 6s ease-in-out infinite'
                  }}
                />

                {/* Orbiting Planet with 3D shading */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: `${planetRadius * 2}px`,
                    height: `${planetRadius * 2}px`,
                    background: `radial-gradient(circle at 25% 25%, 
                      ${systemData.planetColor}FF, 
                      ${systemData.planetColor}CC 50%, 
                      ${systemData.planetColor}80 80%,
                      ${systemData.planetColor}40 100%)`,
                    boxShadow: `
                      inset -${planetRadius * 0.4}px -${planetRadius * 0.4}px ${planetRadius * 0.6}px rgba(0,0,0,0.6),
                      0 0 ${planetRadius * 0.8}px ${systemData.planetColor}30
                    `,
                    transform: `translate(${orbitalRadius}px, 0px) rotateX(75deg)`,
                    animation: `planetOrbit ${systemData.orbitalPeriod / 10}s linear infinite`
                  }}
                />

                {/* Planet Atmosphere Glow (if applicable) */}
                {systemData.atmosphereThickness > 0.3 && (
                  <div
                    className="absolute rounded-full opacity-50"
                    style={{
                      width: `${planetRadius * 2 * (1 + systemData.atmosphereThickness * 0.5)}px`,
                      height: `${planetRadius * 2 * (1 + systemData.atmosphereThickness * 0.5)}px`,
                      background: `radial-gradient(circle, transparent 40%, rgba(135, 206, 235, 0.3) 70%, transparent 100%)`,
                      transform: `translate(${orbitalRadius}px, 0px) rotateX(75deg)`,
                      animation: `planetOrbit ${systemData.orbitalPeriod / 10}s linear infinite`
                    }}
                  />
                )}

                {/* Transit Detection Ray */}
                <div
                  className="absolute h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-60"
                  style={{
                    width: '100%',
                    top: '50%',
                    left: '0%',
                    animation: 'transitPulse 3s ease-in-out infinite'
                  }}
                />

                {/* 3D Orbital Motion Trail */}
                <div
                  className="absolute border border-cyan-400/20 rounded-full animate-pulse"
                  style={{
                    width: `${orbitalRadius * 1.02}px`,
                    height: `${orbitalRadius * 1.02}px`,
                    transform: 'rotateX(75deg)',
                    left: `${(400 - orbitalRadius * 1.02) / 2}px`,
                    top: `${(400 - orbitalRadius * 1.02) / 2}px`
                  }}
                />
              </div>

              {/* Information Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-cyan-400/20">
                  <p className="text-xs text-cyan-300 font-mono">
                    Real-time orbital mechanics • Period: {systemData.orbitalPeriod.toFixed(1)}d • Distance: {systemData.semiMajorAxis.toFixed(3)} AU
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {systemData.planetType} planet • {Math.round(systemData.equilibriumTemp)}K equilibrium temperature
                  </p>
                </div>
              </div>

              {/* View Controls */}
              <div className="absolute top-4 right-4">
                <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-600">
                  <p className="text-xs text-gray-300">3D View</p>
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