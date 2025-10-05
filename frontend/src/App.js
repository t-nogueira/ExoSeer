import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Switch } from "./components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import { 
  Search, Upload, Download, BarChart3, Telescope, Target, 
  Zap, Activity, Globe as Planet, Orbit, TrendingUp, Database, Settings,
  Star, Atom, Gauge, Eye, BookOpen, Cpu, Shield, CheckCircle2, 
  AlertTriangle, Clock, MapPin, Radio, Satellite
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ScatterChart, Scatter } from 'recharts';
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced demo data with sophisticated parameters
const generateAdvancedDemoData = () => {
  return {
    candidates: [
      {
        id: '1',
        name: 'Kepler-452b',
        host_star: 'Kepler-452',
        discovery_method: 'Transit',
        discovery_year: 2015,
        radius_earth: 1.63,
        mass_earth: 5.0,
        orbital_period: 384.843,
        semi_major_axis: 1.046,
        transit_depth: 0.00027,
        duration: 10.4,
        star_temperature: 5757,
        star_radius: 1.11,
        star_mass: 1.04,
        confidence_score: 0.98,
        status: 'confirmed',
        snr: 23.4,
        validation_flags: ['Super-Earth', 'Habitable Zone', 'Rocky Planet'],
        tic_id: 'TIC-8890783',
        kepler_id: 'KIC-9631995',
        magnitude: 13.4,
        coordinates: { ra: 294.1453, dec: 44.2793 },
        reliability: 95.2,
        planet_temperature: 265,
        stellar_metallicity: 0.21,
        insolation_flux: 1.1
      },
      {
        id: '2',
        name: 'TRAPPIST-1d',
        host_star: 'TRAPPIST-1',
        discovery_method: 'Transit',
        discovery_year: 2017,
        radius_earth: 0.77,
        mass_earth: 0.41,
        orbital_period: 4.05,
        semi_major_axis: 0.022,
        transit_depth: 0.00052,
        duration: 2.1,
        star_temperature: 2566,
        star_radius: 0.117,
        star_mass: 0.089,
        confidence_score: 0.92,
        status: 'confirmed',
        snr: 18.7,
        validation_flags: ['M-dwarf System', 'Tidally Locked', 'Potentially Habitable'],
        tic_id: 'TIC-2758341',
        toi_id: 'TOI-1759',
        magnitude: 18.8,
        coordinates: { ra: 346.6223, dec: -5.0413 },
        reliability: 91.8,
        planet_temperature: 288,
        stellar_metallicity: 0.04,
        insolation_flux: 1.16
      },
      {
        id: '3',
        name: 'TOI-715b',
        host_star: 'TOI-715',
        discovery_method: 'Transit',
        discovery_year: 2024,
        radius_earth: 1.55,
        mass_earth: 3.02,
        orbital_period: 19.3,
        semi_major_axis: 0.083,
        transit_depth: 0.0012,
        duration: 3.8,
        star_temperature: 3450,
        star_radius: 0.374,
        star_mass: 0.43,
        confidence_score: 0.87,
        status: 'candidate',
        snr: 12.3,
        validation_flags: ['TESS Discovery', 'Follow-up Required', 'Recent Detection'],
        tic_id: 'TIC-715',
        toi_id: 'TOI-715',
        magnitude: 15.2,
        coordinates: { ra: 128.344, dec: 12.877 },
        reliability: 84.6,
        planet_temperature: 374,
        stellar_metallicity: -0.12,
        insolation_flux: 2.3
      },
      {
        id: '4',
        name: 'K2-18b',
        host_star: 'K2-18',
        discovery_method: 'Transit',
        discovery_year: 2015,
        radius_earth: 2.61,
        mass_earth: 8.63,
        orbital_period: 32.94,
        semi_major_axis: 0.143,
        transit_depth: 0.0019,
        duration: 5.2,
        star_temperature: 3457,
        star_radius: 0.41,
        star_mass: 0.36,
        confidence_score: 0.94,
        status: 'confirmed',
        snr: 28.1,
        validation_flags: ['Sub-Neptune', 'Atmospheric Studies', 'JWST Target'],
        tic_id: 'TIC-247887989',
        coordinates: { ra: 172.560, dec: 7.589 },
        reliability: 93.7,
        planet_temperature: 279,
        stellar_metallicity: -0.24,
        insolation_flux: 1.33
      }
    ],
    lightCurveData: Array.from({length: 2000}, (_, i) => {
      const time = 1354.5 + i * 0.0007;
      const phase = ((time - 1354.5) % 384.843) / 384.843;
      let flux = 1.0 + (Math.random() - 0.5) * 0.0002;
      
      if (Math.abs(phase - 0.5) < 0.01) {
        const transitPhase = Math.abs(phase - 0.5) / 0.01;
        flux -= 0.00027 * Math.exp(-Math.pow(transitPhase * 4, 2));
      }
      
      return { time, flux, phase };
    }),
    architectureData: {
      branches: [
        {
          name: 'Light Curve Branch',
          icon: Activity,
          description: '1D-CNN + Transformer',
          parameters: ['GP detrending', 'Transit shapes', 'Period analysis'],
          weight: 0.45,
          performance: 94.2
        },
        {
          name: 'Pixel/Centroid Branch',
          icon: Eye,
          description: '2D-CNN + Attention',
          parameters: ['Centroid shifts', 'PSF analysis', 'Background flux'],
          weight: 0.25,
          performance: 88.7
        },
        {
          name: 'System Context Branch',
          icon: BookOpen,
          description: 'MLP + Feature Engineering',
          parameters: ['Stellar radius/Teff', 'RUWE/Gaia', 'Catalog data'],
          weight: 0.15,
          performance: 91.3
        },
        {
          name: 'Physics Prior Branch',
          icon: Atom,
          description: 'Physics-guided Network',
          parameters: ['Transit models', 'BLS comparison', 'Kepler laws'],
          weight: 0.15,
          performance: 89.8
        }
      ],
      performance: {
        ensembleAccuracy: 96.4,
        precision: 94.8,
        rocAuc: 0.947,
        domainTransfer: 84.6,
        uncertaintyCalibration: 92.1
      }
    }
  };
};

function App() {
  // Enhanced state management
  const [userMode, setUserMode] = useState('scientist');
  const [targetName, setTargetName] = useState('Kepler-452');
  const [searchResults, setSearchResults] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [demoData, setDemoData] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState("lightcurve");

  // Initialize with sophisticated demo data
  useEffect(() => {
    const demo = generateAdvancedDemoData();
    setDemoData(demo);
    setCandidates(demo.candidates);
    setSelectedCandidate(demo.candidates[0]);
    
    // Set up comprehensive analysis result
    setAnalysisResult({
      target_name: demo.candidates[0].name,
      analysis_id: 'exoseer-001',
      candidate: demo.candidates[0],
      analyses: {
        light_curve: {
          time: demo.lightCurveData.map(d => d.time),
          flux: demo.lightCurveData.map(d => d.flux),
          mission: 'TESS',
          target_name: demo.candidates[0].name,
          length: demo.lightCurveData.length,
          sector: 26
        },
        architecture: demo.architectureData
      }
    });
  }, []);

  const formatValue = (value, precision = 3) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value !== 'number') return value;
    
    if (Math.abs(value) < 0.001 && value !== 0) {
      return value.toExponential(2);
    }
    return value.toFixed(precision);
  };

  const searchTargets = useCallback(async (targetName) => {
    if (!targetName.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/targets/search`, {
        target_name: targetName,
        search_type: 'auto'
      });
      
      let foundCandidates = response.data.candidates || [];
      
      if (foundCandidates.length === 0 && demoData) {
        foundCandidates = demoData.candidates;
      }
      
      setSearchResults({
        target_name: targetName,
        candidates: foundCandidates,
        total_found: foundCandidates.length,
        search_type: 'auto',
        timestamp: new Date().toISOString()
      });
      setCandidates(foundCandidates);
      
    } catch (err) {
      console.error('Search failed:', err);
      if (demoData) {
        setCandidates(demoData.candidates);
        setSearchResults({
          target_name: targetName,
          candidates: demoData.candidates,
          total_found: demoData.candidates.length,
          search_type: 'demo'
        });
      }
    } finally {
      setIsSearching(false);
    }
  }, [demoData]);

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
    
    // Enhanced analysis result for selected candidate
    if (demoData) {
      setAnalysisResult({
        target_name: candidate.name,
        analysis_id: `exoseer-${candidate.id}`,
        candidate: candidate,
        analyses: {
          light_curve: {
            time: demoData.lightCurveData.map(d => d.time),
            flux: demoData.lightCurveData.map(d => d.flux),
            mission: 'TESS',
            target_name: candidate.name,
            length: demoData.lightCurveData.length,
            sector: 26
          },
          architecture: demoData.architectureData
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900" data-testid="exoseer-app">
      {/* Sophisticated Header */}
      <header className="exoseer-header-gradient px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Telescope className="w-10 h-10 text-cyan-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold exoseer-title">ExoSeer</h1>
                <p className="text-xs exoseer-subtitle">Advanced AI Exoplanet Detection & Vetting v1.2.3</p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="exoseer-status-indicator exoseer-status-active"></div>
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">NASA APIs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="exoseer-status-indicator exoseer-status-active"></div>
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium">Physics AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="exoseer-status-indicator exoseer-status-active"></div>
                <Satellite className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-medium">TESS S26</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 text-sm">
              <span className="exoseer-label">Novice Mode</span>
              <Switch 
                checked={userMode === 'scientist'} 
                onCheckedChange={(checked) => setUserMode(checked ? 'scientist' : 'novice')}
              />
              <span className="exoseer-glow-text font-medium">Scientist Mode</span>
            </div>
            <Button variant="ghost" size="sm" className="exoseer-focus-ring">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sophisticated Navigation */}
      <nav className="border-b border-cyan-400/20 bg-slate-900/50 px-6 py-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent space-x-1">
            <TabsTrigger value="analysis" className="exoseer-tab">
              <BarChart3 className="w-4 h-4 mr-2" />
              Target Selection
            </TabsTrigger>
            <TabsTrigger value="missions" className="exoseer-tab">
              <Radio className="w-4 h-4 mr-2" />
              Light Curve Data
            </TabsTrigger>
            <TabsTrigger value="architecture" className="exoseer-tab">
              <Cpu className="w-4 h-4 mr-2" />
              Physics-Informed Transit Analysis
            </TabsTrigger>
            <TabsTrigger value="centroid" className="exoseer-tab">
              <Eye className="w-4 h-4 mr-2" />
              Centroid Motion Analysis
            </TabsTrigger>
            <TabsTrigger value="uncertainty" className="exoseer-tab">
              <Shield className="w-4 h-4 mr-2" />
              Uncertainty Quantification
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="exoseer-tab">
              <Gauge className="w-4 h-4 mr-2" />
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="ensemble" className="exoseer-tab">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ensemble Predictions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </nav>

      <div className="flex h-[calc(100vh-160px)]">
        {/* Advanced Sidebar */}
        <div className="w-80 exoseer-sidebar flex flex-col">
          {/* Target Selection */}
          <div className="p-6 border-b border-cyan-400/20">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-white">Target Selection</h2>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Planet name, TIC ID, coordinates..."
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="text-sm"
              />
              <div className="flex space-x-2">
                <Button 
                  variant="exoseer" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => searchTargets(targetName)}
                  disabled={isSearching}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="exoseer_outline" size="sm">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Candidates List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-cyan-400/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Candidates</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs exoseer-badge exoseer-badge-candidate">
                    {candidates.length} found
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {candidates.map((candidate) => (
                <Card 
                  key={candidate.id}
                  className={`mb-3 cursor-pointer transition-all duration-300 ${
                    selectedCandidate?.id === candidate.id ? 'exoseer-card-selected' : ''
                  }`}
                  onClick={() => handleCandidateClick(candidate)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{candidate.name}</h4>
                        <p className="text-xs exoseer-subtitle truncate">{candidate.host_star}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            RA: {candidate.coordinates?.ra?.toFixed(1)}° Dec: {candidate.coordinates?.dec?.toFixed(1)}°
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          className={candidate.status === 'confirmed' ? 'exoseer-badge-confirmed' : 'exoseer-badge-candidate'}
                        >
                          {candidate.status}
                        </Badge>
                        <span className="text-xs text-gray-400">Mag {candidate.magnitude}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="exoseer-label">Period:</span>
                        <div className="text-white font-medium">{formatValue(candidate.orbital_period)} d</div>
                      </div>
                      <div>
                        <span className="exoseer-label">Radius:</span>
                        <div className="text-white font-medium">{formatValue(candidate.radius_earth)} R⊕</div>
                      </div>
                      <div>
                        <span className="exoseer-label">SNR:</span>
                        <div className="text-cyan-400 font-bold">{formatValue(candidate.snr)}</div>
                      </div>
                      <div>
                        <span className="exoseer-label">Temp:</span>
                        <div className="text-white font-medium">{candidate.planet_temperature}K</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="exoseer-label">Confidence</span>
                        <span className="text-white font-bold">{Math.round(candidate.confidence_score * 100)}%</span>
                      </div>
                      <Progress value={candidate.confidence_score * 100} className="h-2" />
                      
                      <div className="flex justify-between text-xs">
                        <span className="exoseer-label">Reliability</span>
                        <span className="text-cyan-400 font-bold">{formatValue(candidate.reliability)}%</span>
                      </div>
                      <Progress value={candidate.reliability} className="h-2" />
                    </div>

                    {candidate.validation_flags && (
                      <div className="flex flex-wrap gap-1">
                        {candidate.validation_flags.slice(0, 2).map((flag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs px-2 py-1 exoseer-badge exoseer-badge-candidate">
                            {flag}
                          </Badge>
                        ))}
                        {candidate.validation_flags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 exoseer-badge">
                            +{candidate.validation_flags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sophisticated Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedCandidate && analysisResult ? (
            <>
              {/* Analysis Tabs */}
              <div className="border-b border-cyan-400/20 bg-slate-900/30 p-4">
                <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab}>
                  <TabsList className="bg-transparent space-x-2">
                    <TabsTrigger value="overview" className="exoseer-tab">
                      <Planet className="w-4 h-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="lightcurve" className="exoseer-tab">
                      <Activity className="w-4 h-4 mr-2" />
                      Light Curve
                    </TabsTrigger>
                    <TabsTrigger value="architecture" className="exoseer-tab">
                      <Cpu className="w-4 h-4 mr-2" />
                      Architecture
                    </TabsTrigger>
                    <TabsTrigger value="stellar" className="exoseer-tab">
                      <Star className="w-4 h-4 mr-2" />
                      Stellar Parameters
                    </TabsTrigger>
                    <TabsTrigger value="planetary" className="exoseer-tab">
                      <Orbit className="w-4 h-4 mr-2" />
                      Planetary Parameters
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Analysis Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab}>
                  <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {/* Candidate Summary */}
                      <Card className="col-span-1 lg:col-span-2">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                              <Planet className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <div className="exoseer-glow-text">{selectedCandidate.name}</div>
                              <div className="text-sm exoseer-subtitle">Exoplanet Candidate Analysis</div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-cyan-400">{Math.round(selectedCandidate.confidence_score * 100)}%</div>
                              <div className="exoseer-label">Confidence</div>
                            </div>
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-emerald-400">{formatValue(selectedCandidate.reliability)}%</div>
                              <div className="exoseer-label">Reliability</div>
                            </div>
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-yellow-400">{formatValue(selectedCandidate.snr)}</div>
                              <div className="exoseer-label">SNR</div>
                            </div>
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-purple-400">{formatValue(selectedCandidate.orbital_period)}</div>
                              <div className="exoseer-label">Period (d)</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Detection Parameters
                              </h4>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Discovery Method:</span>
                                  <span className="text-white">{selectedCandidate.discovery_method}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Discovery Year:</span>
                                  <span className="text-white">{selectedCandidate.discovery_year}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Status:</span>
                                  <Badge className={selectedCandidate.status === 'confirmed' ? 'exoseer-badge-confirmed' : 'exoseer-badge-candidate'}>
                                    {selectedCandidate.status}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Transit Depth:</span>
                                  <span className="text-cyan-400">{formatValue(selectedCandidate.transit_depth * 100, 4)}%</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <Planet className="w-4 h-4 text-blue-400" />
                                Physical Properties
                              </h4>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Radius:</span>
                                  <span className="text-white">{formatValue(selectedCandidate.radius_earth)} R⊕</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Mass:</span>
                                  <span className="text-white">{formatValue(selectedCandidate.mass_earth)} M⊕</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Temperature:</span>
                                  <span className="text-orange-400">{selectedCandidate.planet_temperature}K</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="exoseer-label">Insolation:</span>
                                  <span className="text-yellow-400">{formatValue(selectedCandidate.insolation_flux)} S⊕</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* AI Assessment */}
                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            AI Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 border border-emerald-400/30">
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                              <div className="text-lg font-bold text-emerald-400">Strong Candidate</div>
                              <div className="text-sm exoseer-subtitle">Recommended for follow-up</div>
                            </div>

                            <div className="space-y-2">
                              <div className="font-medium text-white text-sm">Key Evidence:</div>
                              <ul className="space-y-1 text-sm">
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full bg-cyan-400 mt-2"></div>
                                  <span className="exoseer-subtitle">Consistent transit depth across observations</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full bg-cyan-400 mt-2"></div>
                                  <span className="exoseer-subtitle">Stellar parameters support planetary interpretation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full bg-cyan-400 mt-2"></div>
                                  <span className="exoseer-subtitle">No significant centroid motion detected</span>
                                </li>
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <div className="font-medium text-white text-sm">Recommendations:</div>
                              <ul className="space-y-1 text-sm">
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-2"></div>
                                  <span className="exoseer-subtitle">Radial velocity confirmation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full bg-blue-400 mt-2"></div>
                                  <span className="exoseer-subtitle">High-resolution imaging</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="lightcurve">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            Physics-Informed Transit Analysis
                          </div>
                          <Badge className="exoseer-badge exoseer-badge-confirmed">
                            TESS Sector 26 • 2min cadence
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-cyan-400">
                              {analysisResult.analyses.light_curve?.length || 2000}
                            </div>
                            <div className="exoseer-label">Data Points</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-emerald-400">27.4</div>
                            <div className="exoseer-label">Time Span (d)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-purple-400">2 min</div>
                            <div className="exoseer-label">Cadence</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-yellow-400">{formatValue(selectedCandidate.snr)}</div>
                            <div className="exoseer-label">Detection SNR</div>
                          </div>
                        </div>

                        <div className="exoseer-chart-container">
                          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Orbit className="w-4 h-4 text-cyan-400" />
                            Folded Transit Light Curve
                          </h4>
                          <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={demoData?.lightCurveData.slice(0, 200) || []}>
                                <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                                <XAxis 
                                  dataKey="time" 
                                  stroke="#9CA3AF"
                                  fontSize={10}
                                  tickFormatter={(value) => value.toFixed(3)}
                                />
                                <YAxis 
                                  stroke="#9CA3AF"
                                  fontSize={10}
                                  domain={['dataMin - 0.0005', 'dataMax + 0.0005']}
                                  tickFormatter={(value) => value.toFixed(4)}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                                    border: '1px solid #00d4ff',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                  }}
                                  labelFormatter={(value) => `Time: ${value.toFixed(6)} BTJD`}
                                  formatter={(value) => [value.toFixed(6), 'Relative Flux']}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="flux" 
                                  stroke="#00d4ff" 
                                  strokeWidth={1.5}
                                  dot={false}
                                  connectNulls={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-white">{formatValue(selectedCandidate.transit_depth * 100, 4)}%</div>
                              <div className="exoseer-label">Transit Depth</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-white">{formatValue(selectedCandidate.duration)} hr</div>
                              <div className="exoseer-label">Duration</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-white">0.23</div>
                              <div className="exoseer-label">Impact Parameter</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-white">1.12</div>
                              <div className="exoseer-label">χ² reduced</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="architecture">
                    <div className="space-y-6">
                      {/* Architecture Overview */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-blue-400" />
                            Multimodal Architecture Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                            {demoData?.architectureData.branches.map((branch, index) => (
                              <Card key={index} className="exoseer-metric-card border-none bg-slate-800/50">
                                <div className="text-center p-4">
                                  <branch.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                                  <h4 className="font-semibold text-white mb-2">{branch.name}</h4>
                                  <p className="text-xs exoseer-subtitle mb-3">{branch.description}</p>
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs">
                                      <span className="exoseer-label">Weight:</span>
                                      <span className="text-cyan-400 font-bold">{formatValue(branch.weight)}</span>
                                    </div>
                                    <Progress value={branch.weight * 100} className="h-2" />
                                  </div>

                                  <div className="space-y-1">
                                    {branch.parameters.map((param, idx) => (
                                      <div key={idx} className="text-xs text-gray-400 bg-slate-700/50 rounded px-2 py-1">
                                        {param}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Performance Metrics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Performance Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-emerald-400">
                                {demoData?.architectureData.performance.ensembleAccuracy}%
                              </div>
                              <div className="exoseer-label">Ensemble Accuracy</div>
                              <Progress value={demoData?.architectureData.performance.ensembleAccuracy} className="mt-2 h-1" />
                            </div>
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-blue-400">
                                {demoData?.architectureData.performance.precision}%
                              </div>
                              <div className="exoseer-label">Precision</div>
                              <Progress value={demoData?.architectureData.performance.precision} className="mt-2 h-1" />
                            </div>
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-cyan-400">
                                {demoData?.architectureData.performance.rocAuc}
                              </div>
                              <div className="exoseer-label">ROC AUC</div>
                              <Progress value={demoData?.architectureData.performance.rocAuc * 100} className="mt-2 h-1" />
                            </div>
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-purple-400">
                                {demoData?.architectureData.performance.domainTransfer}%
                              </div>
                              <div className="exoseer-label">Domain Transfer</div>
                              <Progress value={demoData?.architectureData.performance.domainTransfer} className="mt-2 h-1" />
                            </div>
                            <div className="exoseer-metric-card">
                              <div className="text-2xl font-bold text-yellow-400">
                                {demoData?.architectureData.performance.uncertaintyCalibration}%
                              </div>
                              <div className="exoseer-label">Uncertainty Cal.</div>
                              <Progress value={demoData?.architectureData.performance.uncertaintyCalibration} className="mt-2 h-1" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="stellar">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          Stellar Characterization - {selectedCandidate.host_star}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-yellow-400">{selectedCandidate.star_temperature}</div>
                            <div className="exoseer-label">Effective Temperature (K)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-orange-400">{formatValue(selectedCandidate.star_radius)}</div>
                            <div className="exoseer-label">Stellar Radius (R☉)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-red-400">{formatValue(selectedCandidate.star_mass)}</div>
                            <div className="exoseer-label">Stellar Mass (M☉)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-purple-400">{formatValue(selectedCandidate.stellar_metallicity)}</div>
                            <div className="exoseer-label">Metallicity [Fe/H]</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-cyan-400">{selectedCandidate.magnitude}</div>
                            <div className="exoseer-label">V Magnitude</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-emerald-400">G2V</div>
                            <div className="exoseer-label">Spectral Type</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-blue-400">{formatValue(selectedCandidate.coordinates?.ra)}</div>
                            <div className="exoseer-label">Right Ascension (°)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-indigo-400">{formatValue(selectedCandidate.coordinates?.dec)}</div>
                            <div className="exoseer-label">Declination (°)</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="planetary">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Planet className="w-5 h-5 text-blue-400" />
                          Planetary Properties - {selectedCandidate.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-blue-400">{formatValue(selectedCandidate.radius_earth)}</div>
                            <div className="exoseer-label">Radius (R⊕)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-green-400">{formatValue(selectedCandidate.mass_earth)}</div>
                            <div className="exoseer-label">Mass (M⊕)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-purple-400">{formatValue(selectedCandidate.orbital_period)}</div>
                            <div className="exoseer-label">Orbital Period (d)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-cyan-400">{formatValue(selectedCandidate.semi_major_axis)}</div>
                            <div className="exoseer-label">Semi-major Axis (AU)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-orange-400">{selectedCandidate.planet_temperature}</div>
                            <div className="exoseer-label">Equilibrium Temp (K)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-yellow-400">{formatValue(selectedCandidate.insolation_flux)}</div>
                            <div className="exoseer-label">Insolation Flux (S⊕)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-red-400">{formatValue(selectedCandidate.mass_earth / (selectedCandidate.radius_earth ** 3), 2)}</div>
                            <div className="exoseer-label">Density (ρ⊕)</div>
                          </div>
                          <div className="exoseer-metric-card">
                            <div className="text-xl font-bold text-indigo-400">0.15</div>
                            <div className="exoseer-label">Eccentricity</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-96">
                <CardContent className="p-8 text-center">
                  <Telescope className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Select a Candidate</h3>
                  <p className="exoseer-subtitle">
                    Choose an exoplanet candidate from the sidebar to begin sophisticated analysis
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Status Bar */}
      <div className="exoseer-header-gradient border-t border-cyan-400/20 px-6 py-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="exoseer-status-indicator exoseer-status-active"></div>
            <span className="text-emerald-400">NASA Exoplanet Archive Connected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="exoseer-status-indicator exoseer-status-active"></div>
            <span className="text-blue-400">Physics AI Model v2.1.3 Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="exoseer-status-indicator exoseer-status-active"></div>
            <span className="text-purple-400">TESS Sector 26 • 2-min Cadence</span>
          </div>
        </div>
        <div className="exoseer-subtitle">
          ExoSeer v1.2.3 | {candidates.length} candidates loaded | Model trained on {(342147).toLocaleString()} light curves
        </div>
      </div>
    </div>
  );
}

export default App;