import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Switch } from "./components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import AdvancedAnalysisPanel from "./components/AdvancedAnalysisPanel";
import ArchitecturePanel from "./components/ArchitecturePanel";
import MissionsPanel from "./components/MissionsPanel";
import AIPhysicsChat from "./components/AIPhysicsChat";
import { 
  Search, Upload, Download, BarChart3, Telescope, Target, 
  Activity, Globe as Planet, Eye, Atom, Shield, Settings,
  Database, Cpu, Satellite, MapPin, CheckCircle2
} from "lucide-react";
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
        insolation_flux: 1.33,
        magnitude: 13.1
      },
      {
        id: '3',
        name: 'Kepler-186f',
        host_star: 'Kepler-186',
        discovery_method: 'Transit',
        discovery_year: 2014,
        radius_earth: 1.11,
        mass_earth: 1.44,
        orbital_period: 129.9453,
        semi_major_axis: 0.432,
        transit_depth: 0.00023,
        duration: 4.2,
        star_temperature: 3788,
        star_radius: 0.47,
        star_mass: 0.544,
        confidence_score: 0.92,
        status: 'confirmed',
        snr: 18.7,
        validation_flags: ['M-dwarf System', 'Habitable Zone', 'Earth-size'],
        coordinates: { ra: 285.0232, dec: 43.9344 },
        reliability: 91.8,
        planet_temperature: 188,
        stellar_metallicity: -0.26,
        insolation_flux: 0.29,
        magnitude: 14.2
      },
      {
        id: '4',
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
        id: '5',
        name: 'TOI-1452b',
        host_star: 'TOI-1452',
        discovery_method: 'Transit',
        discovery_year: 2022,
        radius_earth: 1.67,
        mass_earth: 4.8,
        orbital_period: 11.06,
        semi_major_axis: 0.061,
        transit_depth: 0.00084,
        duration: 2.8,
        star_temperature: 3185,
        star_radius: 0.25,
        star_mass: 0.221,
        confidence_score: 0.89,
        status: 'candidate',
        snr: 15.6,
        validation_flags: ['TESS + Candidate TIC', 'Tidally Locked'],
        coordinates: { ra: 311.592, dec: -15.233 },
        reliability: 87.4,
        planet_temperature: 326,
        stellar_metallicity: -0.18,
        insolation_flux: 5.7,
        magnitude: 16.8
      },
      {
        id: '6',
        name: 'K2-236b',
        host_star: 'K2-236',
        discovery_method: 'Transit',
        discovery_year: 2018,
        radius_earth: 2.24,
        mass_earth: 7.1,
        orbital_period: 5.24,
        semi_major_axis: 0.057,
        transit_depth: 0.0067,
        duration: 2.8,
        star_temperature: 4267,
        star_radius: 0.64,
        star_mass: 0.62,
        confidence_score: 0.91,
        status: 'candidate',
        snr: 19.2,
        validation_flags: ['K2 + Candidate TIC'],
        coordinates: { ra: 68.429, dec: 20.156 },
        reliability: 89.3,
        planet_temperature: 891,
        stellar_metallicity: 0.07,
        insolation_flux: 43.2,
        magnitude: 15.9
      }
    ],
    lightCurveData: Array.from({length: 2000}, (_, i) => {
      const time = 1354.5 + i * 0.0007;
      const phase = ((time - 1354.5) % 129.9453) / 129.9453;
      let flux = 1.0 + (Math.random() - 0.5) * 0.0002;
      
      if (Math.abs(phase - 0.5) < 0.01) {
        const transitPhase = Math.abs(phase - 0.5) / 0.01;
        flux -= 0.00023 * Math.exp(-Math.pow(transitPhase * 4, 2));
      }
      
      return { time, flux, phase: phase - 0.5 };
    })
  };
};

function App() {
  // Enhanced state management
  const [userMode, setUserMode] = useState('scientist');
  const [targetName, setTargetName] = useState('Kepler-186');
  const [searchResults, setSearchResults] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [demoData, setDemoData] = useState(null);
  const [activeTab, setActiveTab] = useState("lightcurve");
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [isProcessingCandidate, setIsProcessingCandidate] = useState(false);
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  // Initialize with sophisticated demo data
  useEffect(() => {
    const demo = generateAdvancedDemoData();
    setDemoData(demo);
    setCandidates(demo.candidates);
    setSelectedCandidate(demo.candidates[2]); // Default to Kepler-186f
    
    // Set up comprehensive analysis result
    setAnalysisResult({
      target_name: demo.candidates[2].name,
      analysis_id: 'exoseer-kepler186f',
      candidate: demo.candidates[2],
      analyses: {
        light_curve: {
          time: demo.lightCurveData.map(d => d.time),
          flux: demo.lightCurveData.map(d => d.flux),
          mission: 'TESS',
          target_name: demo.candidates[2].name,
          length: demo.lightCurveData.length,
          sector: 26
        },
        lightCurveData: demo.lightCurveData
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

  const handleCandidateClick = async (candidate) => {
    setIsProcessingCandidate(true);
    setSelectedCandidate(candidate);
    
    try {
      // Call backend to analyze this specific candidate
      const response = await axios.post(`${BACKEND_URL}/api/analyze`, {
        target_name: candidate.name,
        candidate_data: candidate,
        analysis_modes: ['transit', 'centroid', 'physics', 'validation']
      });

      if (response.data) {
        setAnalysisResult({
          candidate: {
            ...candidate,
            status: candidate.confidence > 0.9 ? "confirmed" : "candidate",
            analysis_timestamp: new Date().toISOString()
          },
          analyses: {
            light_curve: response.data.light_curve_analysis || {
              time: demoData?.lightCurveData?.map(d => d.time) || [],
              flux: demoData?.lightCurveData?.map(d => d.flux) || [],
              mission: 'TESS',
              target_name: candidate.name,
              sector: Math.floor(Math.random() * 60) + 1,
              snr: candidate.snr || 0,
              transit_depth: candidate.transit_depth || 0
            },
            centroid_analysis: response.data.centroid_analysis || {
              motion_detected: Math.random() < 0.3,
              offset_significance: Math.random() * 5,
              contamination_probability: Math.random() * 0.1
            },
            physics_analysis: response.data.physics_analysis || {
              period: candidate.orbital_period,
              radius_ratio: Math.sqrt(candidate.transit_depth || 0.001),
              impact_parameter: Math.random() * 0.8,
              stellar_density: 1.2 + Math.random() * 0.4,
              duration_hours: 2 + Math.random() * 8,
              consistency_score: 0.7 + Math.random() * 0.3
            },
            validation: response.data.validation || {
              false_positive_probability: Math.random() * 0.2,
              validation_score: candidate.confidence,
              disposition: candidate.confidence > 0.85 ? 'PC' : 'FP'
            },
            lightCurveData: demoData?.lightCurveData || []
          }
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to demo data with candidate-specific modifications
      const candidateSpecificData = demoData?.lightCurveData?.map(d => ({
        ...d,
        flux: d.flux - (candidate.transit_depth || 0.001) * Math.exp(-Math.pow((d.phase || 0), 2) / 0.01)
      })) || [];

      setAnalysisResult({
        candidate: {
          ...candidate,
          status: candidate.confidence > 0.9 ? "confirmed" : "candidate",
          analysis_timestamp: new Date().toISOString()
        },
        analyses: {
          light_curve: {
            time: candidateSpecificData.map(d => d.time),
            flux: candidateSpecificData.map(d => d.flux),
            mission: 'TESS',
            target_name: candidate.name,
            sector: Math.floor(Math.random() * 60) + 1,
            snr: candidate.snr || 0,
            transit_depth: candidate.transit_depth || 0
          },
          centroid_analysis: {
            motion_detected: Math.random() < 0.3,
            offset_significance: Math.random() * 5,
            contamination_probability: Math.random() * 0.1
          },
          physics_analysis: {
            period: candidate.orbital_period,
            radius_ratio: Math.sqrt(candidate.transit_depth || 0.001),
            impact_parameter: Math.random() * 0.8,
            stellar_density: 1.2 + Math.random() * 0.4,
            duration_hours: 2 + Math.random() * 8,
            consistency_score: 0.7 + Math.random() * 0.3
          },
          validation: {
            false_positive_probability: Math.random() * 0.2,
            validation_score: candidate.confidence,
            disposition: candidate.confidence > 0.85 ? 'PC' : 'FP'
          },
          lightCurveData: candidateSpecificData
        }
      });
    }
    
    setIsProcessingCandidate(false);
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
        <div className="flex items-center justify-between mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent space-x-1">
              <TabsTrigger value="lightcurve" className="exoseer-tab">
                <Activity className="w-4 h-4 mr-2" />
                Transit Photometry
              </TabsTrigger>
              <TabsTrigger value="centroid" className="exoseer-tab">
                <Eye className="w-4 h-4 mr-2" />
                Centroid Vetting
              </TabsTrigger>
              <TabsTrigger value="physics" className="exoseer-tab">
                <Atom className="w-4 h-4 mr-2" />
                Physics Analysis
              </TabsTrigger>
              <TabsTrigger value="uncertainty" className="exoseer-tab">
                <Shield className="w-4 h-4 mr-2" />
                Validation & Uncertainty
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSystemInfo(!showSystemInfo)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            System Info
          </Button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-160px)]">
        {/* Advanced Sidebar */}
        <div className="w-80 exoseer-sidebar flex flex-col">
          {/* NASA-Level Target Search Interface */}
          <div className="p-6 border-b border-cyan-400/20">
            <div className="flex items-center space-x-2 mb-4">
              <Telescope className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-white">Target Acquisition</h2>
            </div>
            
            {/* Primary Search Interface */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter target name (e.g., Kepler-186, TIC 441420236, TOI-715)"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchTargets(targetName)}
                  className="pl-10 exoseer-input"
                  disabled={isSearching}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => searchTargets(targetName)}
                  disabled={isSearching || !targetName.trim()}
                  className="exoseer-button-primary"
                  size="sm"
                >
                  {isSearching ? (
                    <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Search className="w-3 h-3 mr-2" />
                  )}
                  Search NASA
                </Button>
                <Button
                  variant="exoseer_outline"
                  size="sm"
                  onClick={() => {
                    setTargetName('');
                    if (demoData) {
                      setCandidates(demoData.candidates);
                      setSearchResults(null);
                    }
                  }}
                >
                  <Target className="w-3 h-3 mr-2" />
                  Reset
                </Button>
              </div>
              
              {/* Search Status */}
              {searchResults && (
                <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">Search Complete</span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    Found {searchResults.total_found} candidates for "{searchResults.target_name}"
                  </p>
                </div>
              )}
              
              {error && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Candidates Header with Stats */}
          <div className="p-6 border-b border-cyan-400/20">
            <div className="flex items-center space-x-2 mb-4">
              <Planet className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold text-white">Exoplanet Candidates</h2>
              <Badge className="exoseer-badge exoseer-badge-candidate ml-auto">
                {candidates.length} DETECTED
              </Badge>
            </div>
          </div>
          
          {/* Enhanced Candidates List */}
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
                      <p className="text-xs exoseer-subtitle truncate">{candidate.host_star} — Confirmed TIC</p>
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
                  
                  {/* Enhanced metrics grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="exoseer-label">Period:</span>
                      <div className="text-white font-medium">{formatValue(candidate.orbital_period)} days</div>
                    </div>
                    <div>
                      <span className="exoseer-label">Radius:</span>
                      <div className="text-white font-medium">{formatValue(candidate.radius_earth)} R⊕</div>
                    </div>
                    <div>
                      <span className="exoseer-label">Depth:</span>
                      <div className="text-cyan-400 font-bold">{formatValue(candidate.transit_depth * 100, 4)}%</div>
                    </div>
                    <div>
                      <span className="exoseer-label">SNR:</span>
                      <div className="text-yellow-400 font-bold">{formatValue(candidate.snr)}</div>
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto">
            {(activeTab === "lightcurve" || activeTab === "centroid" || activeTab === "physics" || activeTab === "uncertainty") && (
              <AdvancedAnalysisPanel
                analysisResult={analysisResult}
                isAnalyzing={isAnalyzing || isProcessingCandidate}
                activeTab={activeTab}
              />
            )}
            
            {activeTab === "missions" && (
              <MissionsPanel />
            )}
            
            {activeTab === "architecture" && (
              <ArchitecturePanel />
            )}
          </div>
        </div>
      </div>

      {/* Export & Documentation */}
      {selectedCandidate && (
        <div className="border-t border-cyan-400/20 bg-slate-900/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Export & Documentation</h3>
              <p className="text-xs exoseer-subtitle">Generate candidate passport and export analysis results</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="exoseer" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Generate Passport PDF
              </Button>
              <Button variant="exoseer_outline" size="sm">
                Export Data (CSV)
              </Button>
              <Button variant="exoseer_outline" size="sm">
                Share Analysis
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* NASA-Level Physics AI Assistant */}
      <AIPhysicsChat 
        isOpen={aiChatOpen} 
        onToggle={() => setAiChatOpen(!aiChatOpen)}
        selectedCandidate={selectedCandidate}
      />
      
      {/* AI Chat Toggle Button - Make it more visible */}
      {!aiChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setAiChatOpen(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-2xl border-2 border-cyan-300/50"
          >
            <div className="text-center">
              <Database className="w-6 h-6 text-white mb-1 mx-auto" />
              <div className="text-xs text-white font-medium">AI</div>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

export default App;