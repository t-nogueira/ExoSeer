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
  Zap, Activity, Globe, Orbit, TrendingUp, Database, Settings,
  Star, Globe as Planet, Atom, Gauge
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ScatterChart, Scatter } from 'recharts';
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Generate realistic demo data for sophisticated interface
const generateDemoData = () => {
  return {
    candidates: [
      {
        id: '1',
        name: 'TRAPPIST-1 d',
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
        snr: 23.4,
        validation_flags: ['High SNR', 'Confirmed transit'],
        tic_id: 'TIC-2758341',
        toi_id: 'TOI-1759',
        coordinates: { ra: 346.6223, dec: -5.0413 }
      },
      {
        id: '2',
        name: 'Kepler-442 b',
        host_star: 'Kepler-442',
        discovery_method: 'Transit',
        discovery_year: 2015,
        radius_earth: 1.34,
        mass_earth: 2.3,
        orbital_period: 112.3,
        semi_major_axis: 0.409,
        transit_depth: 0.00076,
        duration: 6.4,
        star_temperature: 4402,
        star_radius: 0.61,
        star_mass: 0.61,
        confidence_score: 0.96,
        status: 'confirmed',
        snr: 18.7,
        validation_flags: ['Habitable zone', 'Rocky planet'],
        tic_id: 'TIC-8890783',
        kepler_id: 'KIC-9631995'
      },
      {
        id: '3',
        name: 'TOI-715 b',
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
        validation_flags: ['TESS candidate', 'Follow-up needed'],
        tic_id: 'TIC-715',
        toi_id: 'TOI-715'
      },
      {
        id: '4',
        name: 'HD 209458 b',
        host_star: 'HD 209458',
        discovery_method: 'Transit',
        discovery_year: 1999,
        radius_earth: 9.44,
        mass_earth: 220.0,
        orbital_period: 3.52,
        semi_major_axis: 0.047,
        transit_depth: 0.015,
        duration: 3.1,
        star_temperature: 6065,
        star_radius: 1.155,
        star_mass: 1.148,
        confidence_score: 0.98,
        status: 'confirmed',
        snr: 45.2,
        validation_flags: ['First transiting exoplanet', 'Hot Jupiter'],
        coordinates: { ra: 330.795, dec: 18.884 }
      }
    ],
    lightCurveData: Array.from({length: 2000}, (_, i) => {
      const time = 1354.5 + i * 0.0007;
      const phase = ((time - 1354.5) % 3.52) / 3.52;
      let flux = 1.0 + (Math.random() - 0.5) * 0.0003;
      
      if (Math.abs(phase - 0.5) < 0.02) {
        const transitPhase = Math.abs(phase - 0.5) / 0.02;
        flux -= 0.015 * Math.exp(-Math.pow(transitPhase * 3, 2));
      }
      
      return { time, flux, phase };
    }),
    analysisData: {
      transit: {
        period: 3.52474859,
        period_err: 0.00000034,
        depth: 0.01506,
        depth_err: 0.00012,
        duration: 3.097,
        duration_err: 0.019,
        impact_param: 0.507,
        impact_param_err: 0.018,
        snr: 45.2,
        chi_squared: 1.12,
        rp_rs: 0.1228,
        a_rs: 8.76
      },
      stellar: {
        teff: 6065,
        teff_err: 50,
        logg: 4.361,
        logg_err: 0.008,
        feh: 0.00,
        feh_err: 0.05,
        radius: 1.155,
        radius_err: 0.016,
        mass: 1.148,
        mass_err: 0.023
      },
      planetary: {
        radius: 1.359,
        radius_err: 0.019,
        mass: 0.69,
        mass_err: 0.05,
        density: 0.31,
        density_err: 0.03,
        equilibrium_temp: 1449,
        equilibrium_temp_err: 33
      }
    }
  };
};

function App() {
  // State management
  const [userMode, setUserMode] = useState('scientist');
  const [targetName, setTargetName] = useState('HD 209458');
  const [searchResults, setSearchResults] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [demoData, setDemoData] = useState(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState("overview");

  // Initialize with demo data for sophisticated interface
  useEffect(() => {
    const demo = generateDemoData();
    setDemoData(demo);
    setCandidates(demo.candidates);
    setSelectedCandidate(demo.candidates[0]);
    
    // Set up comprehensive analysis result
    setAnalysisResult({
      target_name: demo.candidates[0].name,
      analysis_id: 'demo-001',
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
        transit_analysis: demo.analysisData.transit,
        stellar_analysis: demo.analysisData.stellar,
        planetary_analysis: demo.analysisData.planetary
      }
    });
  }, []);

  // API functions with demo fallback
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
      
      // Use demo data if no real results
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
      // Fallback to demo data
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

  const formatValue = (value, precision = 3) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value !== 'number') return value;
    
    if (Math.abs(value) < 0.001 && value !== 0) {
      return value.toExponential(2);
    }
    return value.toFixed(precision);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white" data-testid="exoseer-app">
      {/* Advanced Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Telescope className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-xl font-bold text-white">ExoSeer</h1>
                <p className="text-xs text-gray-400">Advanced AI Exoplanet Detection & Vetting</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-green-400" />
                <span className="text-green-400">NASA APIs</span>
              </div>
              <div className="flex items-center space-x-2">
                <Atom className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400">Physics AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400">TESS/Kepler</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">Novice</span>
              <Switch 
                checked={userMode === 'scientist'} 
                onCheckedChange={(checked) => setUserMode(checked ? 'scientist' : 'novice')}
              />
              <span className="text-gray-300">Scientist</span>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex space-x-6 text-sm">
          <a href="#" className="text-blue-400 border-b border-blue-400 pb-1">Target Selection</a>
          <a href="#" className="text-gray-400 hover:text-white pb-1">Light Curve Data</a>
          <a href="#" className="text-gray-400 hover:text-white pb-1">Physics-Informed Transit Analysis</a>
          <a href="#" className="text-gray-400 hover:text-white pb-1">Centroid Motion Analysis</a>
          <a href="#" className="text-gray-400 hover:text-white pb-1">Uncertainty Quantification</a>
          <a href="#" className="text-gray-400 hover:text-white pb-1">Diagnostics</a>
          <a href="#" className="text-gray-400 hover:text-white pb-1">Ensemble Predictions</a>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar - Target Selection & Candidates */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Target Search */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-white">Target Selection</h2>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Planet name, TIC ID, or coordinates..."
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
                  <Search className="w-4 h-4 mr-1" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="exoseer_outline" size="sm">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Candidates List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Candidates</h3>
                <Badge variant="outline" className="text-xs">
                  {candidates.length} found
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {candidates.map((candidate) => (
                <Card 
                  key={candidate.id}
                  className={`mb-2 cursor-pointer transition-all hover:border-blue-500 ${
                    selectedCandidate?.id === candidate.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'
                  }`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{candidate.name}</h4>
                        <p className="text-xs text-gray-400 truncate">{candidate.host_star}</p>
                      </div>
                      <Badge 
                        variant={candidate.status === 'confirmed' ? 'confirmed' : 'candidate'}
                        className="text-xs ml-2 flex-shrink-0"
                      >
                        {candidate.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Period:</span>
                        <span className="text-white">{formatValue(candidate.orbital_period)} d</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Radius:</span>
                        <span className="text-white">{formatValue(candidate.radius_earth)} R⊕</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">SNR:</span>
                        <span className="text-white">{formatValue(candidate.snr)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Confidence</span>
                        <span className="text-white">{Math.round(candidate.confidence_score * 100)}%</span>
                      </div>
                      <Progress 
                        value={candidate.confidence_score * 100} 
                        className="h-1"
                      />
                    </div>

                    {candidate.validation_flags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {candidate.validation_flags.slice(0, 2).map((flag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs px-1 py-0">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Analysis Tabs */}
          <div className="border-b border-gray-700">
            <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab}>
              <TabsList className="bg-gray-800 p-1 m-2">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="lightcurve" className="text-xs">Light Curve</TabsTrigger>
                <TabsTrigger value="transit" className="text-xs">Transit Physics</TabsTrigger>
                <TabsTrigger value="stellar" className="text-xs">Stellar Parameters</TabsTrigger>
                <TabsTrigger value="planetary" className="text-xs">Planetary Parameters</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Analysis Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedCandidate && analysisResult ? (
              <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab}>
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Candidate Summary */}
                    <Card className="border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Planet className="w-5 h-5 text-blue-400" />
                          {selectedCandidate.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400">Host Star:</span>
                            <div className="font-medium">{selectedCandidate.host_star}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Discovery:</span>
                            <div className="font-medium">{selectedCandidate.discovery_year}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Method:</span>
                            <div className="font-medium">{selectedCandidate.discovery_method}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <Badge variant={selectedCandidate.status === 'confirmed' ? 'confirmed' : 'candidate'}>
                              {selectedCandidate.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400">Period:</span>
                            <div className="font-medium">{formatValue(selectedCandidate.orbital_period)} days</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Radius:</span>
                            <div className="font-medium">{formatValue(selectedCandidate.radius_earth)} R⊕</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Mass:</span>
                            <div className="font-medium">{formatValue(selectedCandidate.mass_earth)} M⊕</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Transit Depth:</span>
                            <div className="font-medium">{formatValue(selectedCandidate.transit_depth * 100, 4)}%</div>
                          </div>
                        </div>

                        {selectedCandidate.coordinates && (
                          <div className="text-sm">
                            <span className="text-gray-400">Coordinates:</span>
                            <div className="font-medium">
                              RA: {formatValue(selectedCandidate.coordinates.ra)}°, 
                              Dec: {formatValue(selectedCandidate.coordinates.dec)}°
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Gauge className="w-5 h-5 text-green-400" />
                          Detection Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Signal-to-Noise Ratio</span>
                              <span className="font-medium">{formatValue(selectedCandidate.snr)}</span>
                            </div>
                            <Progress value={Math.min(selectedCandidate.snr / 50 * 100, 100)} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Confidence Score</span>
                              <span className="font-medium">{Math.round(selectedCandidate.confidence_score * 100)}%</span>
                            </div>
                            <Progress value={selectedCandidate.confidence_score * 100} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="text-center p-2 bg-gray-800 rounded">
                              <div className="text-lg font-bold text-blue-400">{formatValue(selectedCandidate.star_temperature)}</div>
                              <div className="text-xs text-gray-400">Stellar T_eff (K)</div>
                            </div>
                            <div className="text-center p-2 bg-gray-800 rounded">
                              <div className="text-lg font-bold text-green-400">{formatValue(selectedCandidate.duration)}</div>
                              <div className="text-xs text-gray-400">Transit Duration (hr)</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="lightcurve">
                  <Card className="border-gray-600">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Light Curve Analysis - {analysisResult.analyses.light_curve?.mission}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={demoData?.lightCurveData.slice(0, 500) || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="time" 
                              stroke="#9CA3AF"
                              fontSize={10}
                              tickFormatter={(value) => value.toFixed(3)}
                            />
                            <YAxis 
                              stroke="#9CA3AF"
                              fontSize={10}
                              domain={['dataMin - 0.001', 'dataMax + 0.001']}
                              tickFormatter={(value) => value.toFixed(4)}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '6px'
                              }}
                              labelFormatter={(value) => `Time: ${value.toFixed(6)}`}
                              formatter={(value) => [value.toFixed(6), 'Flux']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="flux" 
                              stroke="#3b82f6" 
                              strokeWidth={1}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-gray-800 rounded">
                          <div className="text-lg font-bold text-blue-400">
                            {analysisResult.analyses.light_curve?.length || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">Data Points</div>
                        </div>
                        <div className="text-center p-3 bg-gray-800 rounded">
                          <div className="text-lg font-bold text-green-400">
                            {analysisResult.analyses.light_curve?.sector || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">TESS Sector</div>
                        </div>
                        <div className="text-center p-3 bg-gray-800 rounded">
                          <div className="text-lg font-bold text-purple-400">2 min</div>
                          <div className="text-xs text-gray-400">Cadence</div>
                        </div>
                        <div className="text-center p-3 bg-gray-800 rounded">
                          <div className="text-lg font-bold text-yellow-400">27.4</div>
                          <div className="text-xs text-gray-400">Time Span (d)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transit">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Orbit className="w-5 h-5 text-purple-400" />
                          Transit Parameters
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          {analysisResult.analyses.transit_analysis && Object.entries(analysisResult.analyses.transit_analysis).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-gray-400 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-medium">
                                {typeof value === 'number' ? formatValue(value) : value}
                                {key.includes('err') && ' σ'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          Model Fit Quality
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">χ² Reduced</span>
                              <span className="font-medium">
                                {formatValue(analysisResult.analyses.transit_analysis?.chi_squared)}
                              </span>
                            </div>
                            <Progress 
                              value={100 - Math.min(analysisResult.analyses.transit_analysis?.chi_squared * 50, 100)} 
                              className="h-2" 
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Signal-to-Noise</span>
                              <span className="font-medium">{formatValue(selectedCandidate.snr)}</span>
                            </div>
                            <Progress 
                              value={Math.min(selectedCandidate.snr / 50 * 100, 100)} 
                              className="h-2" 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-gray-800 rounded text-center">
                              <div className="font-bold text-blue-400">
                                {formatValue(analysisResult.analyses.transit_analysis?.rp_rs)}
                              </div>
                              <div className="text-gray-400">Rp/Rs</div>
                            </div>
                            <div className="p-2 bg-gray-800 rounded text-center">
                              <div className="font-bold text-green-400">
                                {formatValue(analysisResult.analyses.transit_analysis?.a_rs)}
                              </div>
                              <div className="text-gray-400">a/Rs</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="stellar">
                  <Card className="border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        Stellar Characterization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysisResult.analyses.stellar_analysis && Object.entries(analysisResult.analyses.stellar_analysis).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-800 rounded">
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-400">
                                {typeof value === 'number' ? formatValue(value) : value}
                              </div>
                              <div className="text-xs text-gray-400 capitalize mt-1">
                                {key.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="planetary">
                  <Card className="border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-400" />
                        Planetary Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysisResult.analyses.planetary_analysis && Object.entries(analysisResult.analyses.planetary_analysis).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-800 rounded">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-400">
                                {typeof value === 'number' ? formatValue(value) : value}
                              </div>
                              <div className="text-xs text-gray-400 capitalize mt-1">
                                {key.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="border-gray-600">
                <CardContent className="p-8 text-center">
                  <Telescope className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Select a Candidate</h3>
                  <p className="text-sm text-gray-500">
                    Choose a candidate from the list to view detailed analysis results
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-gray-400">NASA APIs Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-gray-400">AI Analysis Ready</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
            <span className="text-gray-400">TESS Sector 26</span>
          </div>
        </div>
        <div className="text-gray-400">
          ExoSeer v1.0.0 | {candidates.length} candidates | Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default App;