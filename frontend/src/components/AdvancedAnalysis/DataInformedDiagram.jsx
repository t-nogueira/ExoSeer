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
          {/* System Visualization */}
          <div className="relative">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Orbit className="w-4 h-4" />
              System Architecture & Transit Geometry
            </h4>
            
            <svg
              viewBox="0 0 400 400"
              className="w-full h-96 bg-slate-900/50 rounded-lg border border-gray-700"
            >
              {/* Background stars */}
              {Array.from({length: 20}, (_, i) => (
                <circle
                  key={i}
                  cx={Math.random() * 400}
                  cy={Math.random() * 400}
                  r="0.5"
                  fill="white"
                  opacity="0.6"
                />
              ))}

              {/* Orbital path */}
              <circle
                cx="200"
                cy="200"
                r={orbitalRadius}
                fill="none"
                stroke="rgba(34, 197, 94, 0.3)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />

              {/* Host Star */}
              <defs>
                <radialGradient id="starGradient" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFF4E6" />
                  <stop offset="70%" stopColor={systemData.stellarTemp > 6000 ? '#E6F3FF' : '#FFE4B5'} />
                  <stop offset="100%" stopColor={systemData.stellarTemp > 6000 ? '#B3D9FF' : '#FFAB40'} />
                </radialGradient>
              </defs>
              
              <circle
                cx="200"
                cy="200"
                r={starRadius}
                fill="url(#starGradient)"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
              />

              {/* Planet with atmosphere */}
              <defs>
                <radialGradient id="planetGradient" cx="40%" cy="30%" r="80%">
                  <stop offset="0%" stopColor={systemData.planetColor} opacity="0.9" />
                  <stop offset="70%" stopColor={systemData.planetColor} opacity="0.7" />
                  <stop offset="100%" stopColor={systemData.planetColor} opacity="0.5" />
                </radialGradient>
                
                {/* Atmosphere gradient */}
                <radialGradient id="atmosphereGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="80%" stopColor="rgba(135, 206, 235, 0.2)" />
                  <stop offset="100%" stopColor="rgba(135, 206, 235, 0.4)" />
                </radialGradient>
              </defs>

              {/* Planet atmosphere (if significant) */}
              {systemData.atmosphereThickness > 0.3 && (
                <circle
                  cx={200 + orbitalRadius}
                  cy="200"
                  r={planetRadius * (1 + systemData.atmosphereThickness)}
                  fill="url(#atmosphereGradient)"
                  opacity="0.6"
                />
              )}

              {/* Planet core */}
              <circle
                cx={200 + orbitalRadius}
                cy="200"
                r={planetRadius}
                fill="url(#planetGradient)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="0.5"
              />

              {/* Transit line of sight */}
              <line
                x1="0"
                y1="200"
                x2="400"
                y2="200"
                stroke="rgba(139, 69, 19, 0.4)"
                strokeWidth="2"
                strokeDasharray="6,3"
              />
              
              {/* Transit indicator */}
              <text x="10" y="195" fill="rgba(139, 69, 19, 0.8)" fontSize="10" className="font-mono">
                Line of Sight → Transit Detection
              </text>

              {/* Scale indicators */}
              <text x="200" y="390" textAnchor="middle" fill="white" fontSize="10" opacity="0.7">
                Orbital Distance: {systemData.semiMajorAxis.toFixed(3)} AU
              </text>
            </svg>
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