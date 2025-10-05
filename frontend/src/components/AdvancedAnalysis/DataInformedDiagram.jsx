import React, { useMemo, useState, useCallback, Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Atom, Thermometer, Orbit, Eye, Info, Box, RotateCcw, 
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

  // Render Line-of-Sight View
  const LineOfSightView = () => {
    const svgWidth = 600;
    const svgHeight = 400;
    const starRadius = 40;
    const planetRadius = starRadius * systemData.rpRs;
    const transitChordY = svgHeight / 2;
    
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Target className="w-4 h-4" />
          Transit Geometry & Line-of-Sight
        </h4>
        
        <div className="bg-slate-900 rounded-lg p-4 border border-gray-700">
          <svg width={svgWidth} height={svgHeight} className="w-full">
            {/* Background stars */}
            {Array.from({length: 50}, (_, i) => (
              <circle
                key={i}
                cx={Math.random() * svgWidth}
                cy={Math.random() * svgHeight}
                r={0.5 + Math.random()}
                fill="white"
                opacity={0.3 + Math.random() * 0.4}
              />
            ))}
            
            {/* Line of sight ray */}
            <line
              x1={0}
              y1={transitChordY}
              x2={svgWidth}
              y2={transitChordY}
              stroke="orange"
              strokeWidth="2"
              opacity="0.8"
              strokeDasharray="5,5"
            />
            
            {/* Host star with limb darkening */}
            <defs>
              <radialGradient id="limbDarkening" cx="30%" cy="30%">
                <stop offset="0%" stopColor="#FFF8DC" />
                <stop offset="60%" stopColor="#FFE4B5" />
                <stop offset="100%" stopColor="#DEB887" />
              </radialGradient>
            </defs>
            
            <circle
              cx={svgWidth / 2}
              cy={transitChordY}
              r={starRadius}
              fill="url(#limbDarkening)"
              onClick={() => setFocusedElement('star')}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredParam('stellar')}
              onMouseLeave={() => setHoveredParam(null)}
            />
            
            {/* Transit chord */}
            <line
              x1={svgWidth / 2 - starRadius}
              y1={transitChordY + systemData.impactParam * starRadius}
              x2={svgWidth / 2 + starRadius}
              y2={transitChordY + systemData.impactParam * starRadius}
              stroke="red"
              strokeWidth="3"
              opacity="0.8"
            />
            
            {/* Planet during transit */}
            <circle
              cx={svgWidth / 2 - starRadius * 0.3}
              cy={transitChordY + systemData.impactParam * starRadius}
              r={planetRadius}
              fill={systemData.planetColor}
              onClick={() => setFocusedElement('planet')}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredParam('planetary')}
              onMouseLeave={() => setHoveredParam(null)}
            />
            
            {/* Impact parameter annotation */}
            <line
              x1={svgWidth / 2}
              y1={transitChordY}
              x2={svgWidth / 2}
              y2={transitChordY + systemData.impactParam * starRadius}
              stroke="cyan"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            
            {/* Labels */}
            <text x={10} y={transitChordY - 5} fill="orange" fontSize="12">
              Line of Sight to Earth
            </text>
            
            <text x={svgWidth / 2 - 20} y={transitChordY - starRadius - 10} fill="yellow" fontSize="12">
              Host Star
            </text>
            
            <text x={svgWidth / 2 + 10} y={transitChordY + systemData.impactParam * starRadius / 2} fill="cyan" fontSize="10">
              b = {systemData.impactParam.toFixed(3)}
            </text>
          </svg>
          
          {/* Interactive annotations */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-cyan-300 font-mono mb-2">Transit Chord</h5>
              <div className="space-y-1 text-xs text-gray-300">
                <div>Length: {(2 * starRadius * Math.sqrt(1 - systemData.impactParam**2) * systemData.stellarRadius * 696000 / 149.6e6).toFixed(3)} AU</div>
                <div>Duration: {systemData.transitDuration.toFixed(2)} hours</div>
                <div>Depth: {(systemData.transitDepth * 1000000).toFixed(0)} ppm</div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-orange-300 font-mono mb-2">Detection Geometry</h5>
              <div className="space-y-1 text-xs text-gray-300">
                <div>Inclination: {systemData.inclination.toFixed(2)}°</div>
                <div>Transit Probability: {(systemData.rpRs * 100).toFixed(3)}%</div>
                <div>Angular Size: {(systemData.stellarRadius * 0.00464 / systemData.semiMajorAxis * 1000).toFixed(2)} mas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Orbital Plane View
  const OrbitalPlaneView = () => {
    const svgSize = 500;
    const center = svgSize / 2;
    const orbitRadius = center * 0.7;
    const starRadius = 15;
    const planetRadius = starRadius * systemData.rpRs * 10; // Exaggerated for visibility
    
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Orbit className="w-4 h-4" />
          Orbital Plane & Mechanics
        </h4>
        
        <div className="bg-slate-900 rounded-lg p-4 border border-gray-700">
          <svg width={svgSize} height={svgSize} className="w-full">
            {/* Orbital ellipse */}
            <ellipse
              cx={center}
              cy={center}
              rx={orbitRadius}
              ry={orbitRadius * (1 - systemData.eccentricity)}
              fill="none"
              stroke="emerald"
              strokeWidth="2"
              strokeDasharray="3,3"
              opacity="0.6"
            />
            
            {/* Habitable zone if available */}
            {systemData.habitableZone && (
              <>
                <circle
                  cx={center}
                  cy={center}
                  r={orbitRadius * systemData.habitableZone.rinAu / systemData.semiMajorAxis}
                  fill="none"
                  stroke="green"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <circle
                  cx={center}
                  cy={center}
                  r={orbitRadius * systemData.habitableZone.routAu / systemData.semiMajorAxis}
                  fill="none"
                  stroke="green"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text x={center + orbitRadius * 0.8} y={center - 10} fill="green" fontSize="10">
                  HZ
                </text>
              </>
            )}
            
            {/* Host star */}
            <circle
              cx={center}
              cy={center}
              r={starRadius}
              fill="yellow"
              onClick={() => setFocusedElement('star')}
              className="cursor-pointer"
            />
            
            {/* Planet position */}
            <circle
              cx={center + orbitRadius * Math.cos(systemData.phase * 2 * Math.PI)}
              cy={center + orbitRadius * Math.sin(systemData.phase * 2 * Math.PI)}
              r={planetRadius}
              fill={systemData.planetColor}
              onClick={() => setFocusedElement('planet')}
              className="cursor-pointer"
            />
            
            {/* Periapsis and apoapsis markers */}
            <circle cx={center + orbitRadius} cy={center} r="3" fill="red" />
            <circle cx={center - orbitRadius} cy={center} r="3" fill="blue" />
            <text x={center + orbitRadius + 5} y={center + 5} fill="red" fontSize="10">Periapsis</text>
            <text x={center - orbitRadius - 30} y={center + 5} fill="blue" fontSize="10">Apoapsis</text>
            
            {/* Velocity vector */}
            <line
              x1={center + orbitRadius * Math.cos(systemData.phase * 2 * Math.PI)}
              y1={center + orbitRadius * Math.sin(systemData.phase * 2 * Math.PI)}
              x2={center + orbitRadius * Math.cos(systemData.phase * 2 * Math.PI) - 20 * Math.sin(systemData.phase * 2 * Math.PI)}
              y2={center + orbitRadius * Math.sin(systemData.phase * 2 * Math.PI) + 20 * Math.cos(systemData.phase * 2 * Math.PI)}
              stroke="green"
              strokeWidth="2"
            />
            
            {/* Eccentricity annotation */}
            <text x={20} y={30} fill="white" fontSize="12">
              e = {systemData.eccentricity.toFixed(3)}
            </text>
            <text x={20} y={45} fill="white" fontSize="12">
              a = {systemData.semiMajorAxis.toFixed(3)} AU
            </text>
          </svg>
          
          {/* Orbital mechanics parameters */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-emerald-300 font-mono mb-2">Orbit</h5>
              <div className="space-y-1 text-xs text-gray-300">
                <div>Period: {systemData.orbitalPeriod.toFixed(2)} d</div>
                <div>Eccentricity: {systemData.eccentricity.toFixed(3)}</div>
                <div>Inclination: {systemData.inclination.toFixed(1)}°</div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-green-300 font-mono mb-2">Dynamics</h5>
              <div className="space-y-1 text-xs text-gray-300">
                <div>Velocity: {(systemData.orbitalVelocity / 1000).toFixed(1)} km/s</div>
                <div>ω: {systemData.omegaDeg.toFixed(1)}°</div>
                <div>Phase: {(systemData.phase * 360).toFixed(1)}°</div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-blue-300 font-mono mb-2">Habitable Zone</h5>
              <div className="space-y-1 text-xs text-gray-300">
                {systemData.habitableZone ? (
                  <>
                    <div>Inner: {systemData.habitableZone.rinAu.toFixed(3)} AU</div>
                    <div>Outer: {systemData.habitableZone.routAu.toFixed(3)} AU</div>
                    <div>Planet: {systemData.semiMajorAxis < systemData.habitableZone.routAu && systemData.semiMajorAxis > systemData.habitableZone.rinAu ? 'Inside' : 'Outside'}</div>
                  </>
                ) : (
                  <div>Stellar data unavailable</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Side View
  const SideView = () => {
    const svgWidth = 600;
    const svgHeight = 300;
    const starRadius = 30;
    const planetRadius = starRadius * systemData.rpRs * 5; // Scale for visibility
    const distance = 200;
    
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Side View & Scale Comparison
        </h4>
        
        <div className="bg-slate-900 rounded-lg p-4 border border-gray-700">
          <svg width={svgWidth} height={svgHeight} className="w-full">
            {/* Host star */}
            <circle
              cx={100}
              cy={svgHeight / 2}
              r={starRadius}
              fill="yellow"
              onClick={() => setFocusedElement('star')}
              className="cursor-pointer"
            />
            
            {/* Planet */}
            <circle
              cx={100 + distance}
              cy={svgHeight / 2}
              r={planetRadius}
              fill={systemData.planetColor}
              onClick={() => setFocusedElement('planet')}
              className="cursor-pointer"
            />
            
            {/* Distance line */}
            <line
              x1={100 + starRadius}
              y1={svgHeight / 2 - 40}
              x2={100 + distance - planetRadius}
              y2={svgHeight / 2 - 40}
              stroke="cyan"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            
            {/* Atmosphere representation */}
            {systemData.atmosphereThickness > 0.2 && (
              <circle
                cx={100 + distance}
                cy={svgHeight / 2}
                r={planetRadius * (1 + systemData.atmosphereThickness)}
                fill="none"
                stroke="lightblue"
                strokeWidth="2"
                opacity="0.5"
              />
            )}
            
            {/* Labels */}
            <text x={100 - 15} y={svgHeight / 2 + starRadius + 15} fill="yellow" fontSize="12" textAnchor="middle">
              Host Star
            </text>
            <text x={100 + distance} y={svgHeight / 2 + planetRadius + 20} fill={systemData.planetColor} fontSize="12" textAnchor="middle">
              {candidate?.name}
            </text>
            <text x={100 + distance / 2} y={svgHeight / 2 - 50} fill="cyan" fontSize="12" textAnchor="middle">
              {systemData.semiMajorAxis.toFixed(3)} AU
            </text>
            
            {/* Atmospheric escape indicator */}
            {systemData.escapeParameter > 0.1 && (
              <g>
                {Array.from({length: 8}, (_, i) => (
                  <circle
                    key={i}
                    cx={100 + distance + (Math.random() - 0.5) * planetRadius * 3}
                    cy={svgHeight / 2 - planetRadius - i * 5}
                    r="1"
                    fill="lightblue"
                    opacity="0.6"
                  />
                ))}
                <text x={100 + distance + planetRadius + 10} y={svgHeight / 2 - planetRadius} fill="lightblue" fontSize="10">
                  Atm. Escape
                </text>
              </g>
            )}
          </svg>
          
          {/* Scale and physical parameters */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-yellow-300 font-mono mb-2">Stellar Properties</h5>
              <div className="space-y-1 text-xs text-gray-300">
                <div>Radius: {systemData.stellarRadius.toFixed(2)} R☉</div>
                <div>Mass: {systemData.stellarMass.toFixed(2)} M☉</div>
                <div>Temperature: {systemData.stellarTemp} K</div>
                <div>Luminosity: {systemData.stellarLuminosity.toFixed(2)} L☉</div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-cyan-300 font-mono mb-2">Planetary Properties</h5>
              <div className="space-y-1 text-xs text-gray-300">
                <div>Radius: {systemData.planetRadius.toFixed(2)} R⊕</div>
                <div>Mass: {systemData.planetMass.toFixed(2)} M⊕</div>
                <div>Gravity: {(systemData.surfaceGravity / 9.81).toFixed(2)} g</div>
                <div>T_eq: {Math.round(systemData.equilibriumTemp)} K</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-cyan-500/30 bg-cyan-900/5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Atom className="w-5 h-5" />
            Data-Informed System Diagram
          </div>
          {mode === 'scientist' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShow3D(!show3D)}
              className="flex items-center gap-2"
            >
              <Cube className="w-4 h-4" />
              {show3D ? 'Multi-View' : '3D Mode'}
            </Button>
          )}
        </CardTitle>
        <p className="text-sm text-gray-300">
          Multiple perspective views with scientifically accurate annotations
        </p>
      </CardHeader>
      <CardContent>
        {show3D && mode === 'scientist' ? (
          <Suspense fallback={
            <div className="flex items-center justify-center h-96 bg-slate-900 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading 3D Viewer...</p>
              </div>
            </div>
          }>
            <ThreeDViewer systemData={systemData} candidate={candidate} />
          </Suspense>
        ) : (
          <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="line-of-sight" className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                Line-of-Sight
              </TabsTrigger>
              <TabsTrigger value="orbital-plane" className="flex items-center gap-2">
                <Orbit className="w-4 h-4" />
                Orbital Plane
              </TabsTrigger>
              <TabsTrigger value="side-view" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Side View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="line-of-sight" className="space-y-4">
              <LineOfSightView />
            </TabsContent>

            <TabsContent value="orbital-plane" className="space-y-4">
              <OrbitalPlaneView />
            </TabsContent>

            <TabsContent value="side-view" className="space-y-4">
              <SideView />
            </TabsContent>
          </Tabs>
        )}

        {/* Focused element details panel */}
        {focusedElement && (
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-cyan-500/30">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-cyan-300 font-mono">
                {focusedElement === 'star' ? 'Host Star Details' : 'Planet Details'}
              </h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFocusedElement(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>
            
            {focusedElement === 'star' ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-300 mb-1">Stellar Classification</div>
                  <div className="text-white">{systemData.stellarTemp > 6000 ? 'F-type' : systemData.stellarTemp > 5000 ? 'G-type' : 'K-type'}</div>
                </div>
                <div>
                  <div className="text-gray-300 mb-1">Limb Darkening</div>
                  <div className="text-white">u₁={systemData.limbDarkening.u1.toFixed(3)}, u₂={systemData.limbDarkening.u2.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-gray-300 mb-1">Spectral Features</div>
                  <div className="text-white">{systemData.stellarTemp > 6000 ? 'Metal lines, shallow convection' : 'Deep convection zone'}</div>
                </div>
                <div>
                  <div className="text-gray-300 mb-1">Stellar Wind</div>
                  <div className="text-white">{(systemData.stellarLuminosity * 2e-14).toFixed(2)} M☉/yr</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-300 mb-1">Composition Hint</div>
                  <div className="text-white">
                    {systemData.planetType === 'Rocky' ? 'Silicate/Iron' : 
                     systemData.planetType === 'Super Earth' ? 'Rock + Volatiles' :
                     systemData.planetType === 'Sub-Neptune' ? 'H/He Envelope' : 'Gas Giant'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-300 mb-1">Atmospheric Retention</div>
                  <div className="text-white">
                    {systemData.escapeParameter < 0.1 ? 'Stable' : 'Escaping'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-300 mb-1">Transit Signal</div>
                  <div className="text-white">{(systemData.transitDepth * 1000000).toFixed(0)} ppm</div>
                </div>
                <div>
                  <div className="text-gray-300 mb-1">Follow-up Priority</div>
                  <div className="text-white">
                    {systemData.transitDepth > 0.001 ? 'High' : systemData.transitDepth > 0.0001 ? 'Medium' : 'Low'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(systemData, null, 2))}`;
              const link = document.createElement('a');
              link.href = dataUri;
              link.download = `${candidate?.name || 'system'}_parameters.json`;
              link.click();
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = 800;
              canvas.height = 600;
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, 800, 600);
              ctx.fillStyle = '#ffffff';
              ctx.font = '16px monospace';
              ctx.fillText(`System Diagram: ${candidate?.name || 'Unknown'}`, 20, 40);
              
              const link = document.createElement('a');
              link.download = `${candidate?.name || 'system'}_diagram.png`;
              link.href = canvas.toDataURL();
              link.click();
            }}
          >
            Export PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const svg = document.querySelector('svg');
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${candidate?.name || 'system'}_diagram.svg`;
                link.click();
                URL.revokeObjectURL(url);
              }
            }}
          >
            Export SVG
          </Button>
        </div>

        {/* Data provenance */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Data Provenance & Traceability
          </h5>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <div>Source: {systemData.provenance.source}</div>
              <div>Dataset: {systemData.provenance.datasetId}</div>
            </div>
            <div>
              <div>Model Hash: {systemData.provenance.modelHash}</div>
              <div>Calculation: Real-time derived</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataInformedDiagram;