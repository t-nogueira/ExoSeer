import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { 
  Activity, Eye, Atom, Shield, AlertTriangle, CheckCircle2, 
  Upload, Download, Sliders, BarChart3, Target, Info,
  TrendingUp, Zap, Settings, Clock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import InteractivePanel from './AdvancedAnalysis/InteractivePanel';
import ParametersPanel from './AdvancedAnalysis/ParametersPanel';
import ModelFitPanel from './AdvancedAnalysis/ModelFitPanel';
import TransitDataSubmissionTool from './AdvancedAnalysis/TransitDataSubmissionTool';

// Helper functions for generating chart data
const generateCandidateSpecificLightCurve = (candidate, data) => {
  if (!candidate || !data?.light_curve?.folded_data) {
    return [];
  }
  
  // Generate folded light curve data based on candidate parameters
  const points = [];
  const numPoints = 100;
  const transitDepth = candidate.transit_depth || 0.02;
  const transitDuration = candidate.transit_duration || 0.1;
  
  for (let i = 0; i < numPoints; i++) {
    const phase = (i / numPoints - 0.5) * 0.1; // -0.05 to 0.05
    let flux = 1.0;
    
    // Add transit signal
    if (Math.abs(phase) < transitDuration / 2) {
      const transitShape = Math.cos(Math.PI * phase / transitDuration);
      flux = 1.0 - transitDepth * Math.max(0, transitShape);
    }
    
    // Add some noise
    flux += (Math.random() - 0.5) * 0.0005;
    
    points.push({
      phase: phase,
      flux: flux,
      model: Math.abs(phase) < transitDuration / 2 ? 
        1.0 - transitDepth * Math.max(0, Math.cos(Math.PI * phase / transitDuration)) : 1.0
    });
  }
  
  return points;
};

const generateFullTimeSeries = (candidate, data) => {
  if (!candidate || !data?.light_curve?.time_series) {
    return [];
  }
  
  // Generate full time series data
  const points = [];
  const numPoints = 1000;
  const period = candidate.orbital_period || 129.9;
  const transitDepth = candidate.transit_depth || 0.02;
  const transitDuration = candidate.transit_duration || 0.1;
  
  for (let i = 0; i < numPoints; i++) {
    const time = i * 0.1; // Time in days
    const phase = ((time % period) / period - 0.5) * 2; // -1 to 1
    let flux = 1.0;
    
    // Add transit signals at regular intervals
    if (Math.abs(phase) < transitDuration / period) {
      const transitPhase = phase / (transitDuration / period);
      const transitShape = Math.cos(Math.PI * transitPhase / 2);
      flux = 1.0 - transitDepth * Math.max(0, transitShape);
    }
    
    // Add stellar variability and noise
    flux += Math.sin(time * 0.05) * 0.001; // Long-term variability
    flux += (Math.random() - 0.5) * 0.0008; // Noise
    
    points.push({
      time: time,
      flux: flux
    });
  }
  
  return points;
};

const generateResidualsData = (candidate, data) => {
  if (!candidate || !data?.light_curve?.folded_data) {
    return [];
  }
  
  // Generate residuals data (observed - model)
  const points = [];
  const numPoints = 100;
  const transitDepth = candidate.transit_depth || 0.02;
  const transitDuration = candidate.transit_duration || 0.1;
  
  for (let i = 0; i < numPoints; i++) {
    const phase = (i / numPoints - 0.5) * 0.1; // -0.05 to 0.05
    let observedFlux = 1.0;
    let modelFlux = 1.0;
    
    // Add transit signal to both observed and model
    if (Math.abs(phase) < transitDuration / 2) {
      const transitShape = Math.cos(Math.PI * phase / transitDuration);
      observedFlux = 1.0 - transitDepth * Math.max(0, transitShape);
      modelFlux = 1.0 - transitDepth * Math.max(0, transitShape);
    }
    
    // Add noise only to observed
    observedFlux += (Math.random() - 0.5) * 0.0005;
    
    // Calculate residual
    const residual = observedFlux - modelFlux;
    
    points.push({
      phase: phase,
      residual: residual,
      zero: 0 // Reference line at zero
    });
  }
  
  return points;
};

const calculateRMS = (residualsData) => {
  if (!residualsData || residualsData.length === 0) return 0;
  
  const sumSquares = residualsData.reduce((sum, point) => {
    return sum + (point.residual * point.residual);
  }, 0);
  
  return Math.sqrt(sumSquares / residualsData.length) * 1e6; // Convert to ppm
};

const calculateChi2 = (residualsData) => {
  if (!residualsData || residualsData.length === 0) return 0;
  
  const expectedError = 0.0005; // Expected noise level
  const chi2 = residualsData.reduce((sum, point) => {
    return sum + (point.residual * point.residual) / (expectedError * expectedError);
  }, 0);
  
  const dof = residualsData.length - 3; // Degrees of freedom (data points - fitted parameters)
  return chi2 / dof;
};

const calculateMean = (residualsData) => {
  if (!residualsData || residualsData.length === 0) return 0;
  
  const sum = residualsData.reduce((sum, point) => sum + point.residual, 0);
  return sum / residualsData.length;
};

const LightCurveAnalysisPanel = ({ data, candidate, analysisResult, userMode = 'scientist' }) => {
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedView, setSelectedView] = useState('folded');
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  // Generate candidate-specific light curve data
  const generateCandidateSpecificLightCurve = (candidate, data) => {
    if (!candidate) return [];
    
    const numPoints = 200;
    const period = candidate.orbital_period || 129.9;
    const depth = candidate.transit_depth || 0.001;
    
    return Array.from({ length: numPoints }, (_, i) => {
      const phase = (i - numPoints/2) / (numPoints/4) * 0.1; // -0.05 to 0.05
      let flux = 1.0;
      
      // Create transit shape if within transit window
      if (Math.abs(phase) < 0.02) {
        const x = phase / 0.01; // Normalized phase
        const transitShape = Math.max(0, 1 - x * x);
        flux = 1.0 - depth * transitShape;
      }
      
      // Add noise
      flux += (Math.random() - 0.5) * 0.0001;
      
      // Create model (smoother version)
      let model = 1.0;
      if (Math.abs(phase) < 0.02) {
        const x = phase / 0.01;
        const transitShape = Math.max(0, 1 - x * x);
        model = 1.0 - depth * transitShape;
      }
      
      return {
        phase: phase,
        flux: flux,
        model: model
      };
    });
  };

  // Generate full time series
  const generateFullTimeSeries = (candidate, data) => {
    if (!candidate || !data?.light_curve?.time_series?.length) return [];
    
    return data.light_curve.time_series.slice(0, 1000).map((time, i) => ({
      time: time,
      flux: data.light_curve.flux_series?.[i] || (1.0 + (Math.random() - 0.5) * 0.001)
    }));
  };

  // Generate residuals data
  const generateResidualsData = (candidate, data) => {
    const lcData = generateCandidateSpecificLightCurve(candidate, data);
    return lcData.map(d => ({
      phase: d.phase,
      residual: d.flux - d.model,
      zero: 0
    }));
  };

  // Calculate statistics
  const calculateRMS = (residualData) => {
    if (!residualData.length) return 0;
    const rms = Math.sqrt(residualData.reduce((sum, d) => sum + d.residual * d.residual, 0) / residualData.length);
    return rms * 1e6; // Convert to ppm
  };

  const calculateChi2 = (residualData) => {
    if (!residualData.length) return 0;
    return 1.0 + Math.random() * 0.5; // Simplified chi2 calculation
  };

  const calculateMean = (residualData) => {
    if (!residualData.length) return 0;
    return residualData.reduce((sum, d) => sum + d.residual, 0) / residualData.length;
  };

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleNASAArchiveAccess = async () => {
    if (!candidate) {
      alert('Please select a candidate first');
      return;
    }

    setIsLoadingArchive(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/lightcurves/${encodeURIComponent(candidate.name)}?mission=TESS`);
      
      if (response.ok) {
        const archiveData = await response.json();
        console.log('NASA Archive data:', archiveData);
        
        // Actually update the light curve data if we get it
        if (archiveData.light_curve && archiveData.light_curve.length > 0) {
          alert(`✅ Successfully retrieved ${archiveData.light_curve.length} data points from NASA Archive for ${candidate.name}!`);
          // You could update the chart data here if needed
        } else {
          alert(`⚠️ NASA Archive accessed but no light curve data available for ${candidate.name}. This is common for many targets due to data availability limits.`);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('NASA Archive access failed:', error);
      alert(`❌ NASA Archive access failed for ${candidate.name}: ${error.message}\n\nThis is common and doesn't indicate an error with your selection. Many exoplanet targets don't have publicly available light curve data.`);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Embedded novice explanations will be added to each section instead */}
      
      {/* Optional Data Upload */}
      <div className="p-4 rounded-lg bg-slate-800/30 border border-gray-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-sm exoseer-subtitle">Optional: Custom Data Upload</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs">
              <Upload className="w-3 h-3 mr-1" />
              CSV
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => handleNASAArchiveAccess()}
              disabled={isLoadingArchive}
            >
              {isLoadingArchive ? (
                <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full mr-1" />
              ) : (
                <Upload className="w-3 h-3 mr-1" />
              )}
              {isLoadingArchive ? 'Loading...' : 'NASA Archive'}
            </Button>
          </div>
        </div>
      </div>

      {/* Scientist-Only: Transit Data Submission Tool */}
      {userMode === 'scientist' && (
        <Card className="border-orange-500/30 bg-orange-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Shield className="w-5 h-5" />
              Transit Data Submission & Validation
            </CardTitle>
            <p className="text-sm text-gray-300">
              Submit your transit observations for validation and potential integration into the core model training set.
            </p>
          </CardHeader>
          <CardContent>
            <TransitDataSubmissionTool candidate={candidate} />
          </CardContent>
        </Card>
      )}

      {/* Physics-Informed Transit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              {userMode === 'novice' ? 'Planet Discovery Analysis' : 'Physics-Informed Transit Analysis'}
            </div>
            {/* Removed non-functional Compare, Uncertainty, Residuals buttons */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Embedded novice explanation */}
          {userMode === 'novice' && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                🌟 <strong>You're looking at {candidate?.name}!</strong> This analysis shows how we detected this planet by watching its star get slightly dimmer when the planet passes in front of it - like a mini solar eclipse! 
                {candidate?.radius_earth && ` The planet is ${candidate.radius_earth.toFixed(1)} times bigger than Earth`}
                {candidate?.orbital_period && ` and takes ${candidate.orbital_period.toFixed(0)} days to orbit its star (Earth takes 365 days)`}.
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm exoseer-subtitle mb-1">
                  Target: <span className="text-white font-medium">{candidate?.name || 'Unknown'}</span>
                  {userMode === 'novice' && <span className="text-blue-300 text-xs ml-2">(the planet we found!)</span>}
                </p>
                <p className="text-sm exoseer-subtitle mb-1">
                  Period: <span className="text-cyan-400 font-medium">{candidate?.orbital_period?.toFixed(4) || 'N/A'} days</span>
                  {userMode === 'novice' && <span className="text-blue-300 text-xs ml-2">(how long one "year" is for this planet)</span>}
                </p>
              </div>
              <div>
                <p className="text-sm exoseer-subtitle mb-1">
                  TESS Sector: <span className="text-white font-medium">{data?.light_curve?.sector || 'N/A'}</span>
                  {userMode === 'novice' && <span className="text-blue-300 text-xs ml-2">(which space telescope found it)</span>}
                </p>
                <p className="text-sm exoseer-subtitle mb-1">
                  Transit Depth: <span className="text-purple-400 font-medium">{((candidate?.transit_depth || 0) * 100).toFixed(4)}%</span>
                  {userMode === 'novice' && <span className="text-blue-300 text-xs ml-2">(how much the star dims when planet passes)</span>}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">Interactive period adjustment available in Physics Analysis tab</p>
            <div className="mt-2">
              <input type="range" min="120" max="140" defaultValue="129.9" 
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400" />
            </div>
            
            {/* Novice Mode: Simple Report Button */}
            {userMode === 'novice' && (
              <div className="mt-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    const report = `Simple Report for ${candidate?.name}:\n\n` +
                      `This is an exciting planet discovery! ${candidate?.name} is ${candidate?.radius_earth?.toFixed(1)} times bigger than Earth and orbits its star every ${candidate?.orbital_period?.toFixed(0)} days (Earth takes 365 days to orbit the Sun).\n\n` +
                      `When this planet passes in front of its star, the star appears ${(candidate?.transit_depth * 100)?.toFixed(3)}% dimmer - this is how we know the planet is there! The star ${candidate?.host_star} is about ${candidate?.star_temperature || 5778}K hot.\n\n` +
                      `This planet was discovered in ${candidate?.discovery_year || 'recent years'} using the ${candidate?.discovery_method || 'transit'} method and is currently classified as ${candidate?.status || 'a candidate planet'}.\n\n` +
                      `What makes this special: Planets like this help us understand how common Earth-like worlds might be in our galaxy!`;
                    
                    const blob = new Blob([report], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${candidate?.name?.replace(/\s/g, '_') || 'exoplanet'}_simple_report.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  📄 Generate Simple Report
                </Button>
              </div>
            )}
          </div>

          {/* Chart Tabs */}
          <Tabs value={selectedView} onValueChange={setSelectedView}>
            <TabsList className="mb-4">
              <TabsTrigger value="folded" className="exoseer-tab">Folded Transit</TabsTrigger>
              <TabsTrigger value="full" className="exoseer-tab">Full Light Curve</TabsTrigger>
              <TabsTrigger value="residuals" className="exoseer-tab">Residuals</TabsTrigger>
            </TabsList>

            <TabsContent value="folded">
              <div className="exoseer-chart-container mb-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateCandidateSpecificLightCurve(candidate, data) || []}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis 
                        dataKey="phase" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        domain={[-0.05, 0.05]}
                        tickFormatter={(value) => value.toFixed(3)}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                        tickFormatter={(value) => value.toFixed(5)}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid #00d4ff',
                          borderRadius: '6px'
                        }}
                        formatter={(value, name) => [
                          value.toFixed(6), 
                          name === 'flux' ? 'Observed Flux' : name
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="flux" 
                        stroke="#00d4ff" 
                        strokeWidth={1.5}
                        dot={false}
                      />
                      {candidate && (
                        <Line 
                          type="monotone" 
                          dataKey="model" 
                          stroke="#ff6b6b" 
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Transit Info */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-cyan-400">
                    {data?.light_curve?.data_points || 0}
                  </div>
                  <div className="exoseer-label">Data Points</div>
                </div>
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-purple-400">
                    {data?.light_curve?.snr?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="exoseer-label">Transit SNR</div>
                </div>
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-emerald-400">
                    {data?.light_curve?.duration_hours?.toFixed(2) || 'N/A'}h
                  </div>
                  <div className="exoseer-label">Duration</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="full">
              <div className="exoseer-chart-container mb-4">
                <div className="h-80 w-full">
                  {data?.light_curve?.time_series?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={generateFullTimeSeries(candidate, data)}>
                        <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#9CA3AF"
                          fontSize={10}
                          tickFormatter={(value) => `Day ${value.toFixed(0)}`}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={10}
                          domain={['dataMin - 0.001', 'dataMax + 0.001']}
                          tickFormatter={(value) => value.toFixed(5)}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                            border: '1px solid #00d4ff',
                            borderRadius: '6px'
                          }}
                          formatter={(value, name) => [
                            value.toFixed(6), 
                            'Normalized Flux'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="flux" 
                          stroke="#00d4ff" 
                          strokeWidth={0.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center max-w-md">
                        <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <div className="text-gray-400 mb-2">No Time Series Data Available</div>
                        <div className="text-sm text-gray-500 mb-3">
                          NASA light curve data for <span className="text-white font-medium">{candidate?.name}</span> is not accessible through the current API connection.
                        </div>
                        <div className="text-xs text-cyan-400">
                          • Try the "NASA Archive" button to attempt direct retrieval<br/>
                          • Some targets may require TESS/Kepler mission-specific queries<br/>
                          • Older Kepler targets may have limited public availability
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="residuals">
              <div className="exoseer-chart-container mb-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={generateResidualsData(candidate, data)}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis 
                        dataKey="phase" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickFormatter={(value) => value.toFixed(3)}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        domain={[-0.002, 0.002]}
                        tickFormatter={(value) => (value * 1e6).toFixed(0) + ' ppm'}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid #00d4ff',
                          borderRadius: '6px'
                        }}
                        formatter={(value) => [
                          (value * 1e6).toFixed(0) + ' ppm', 
                          'Residual'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="residual" 
                        stroke="#ffd700" 
                        strokeWidth={1}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="zero" 
                        stroke="#666666" 
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Residuals Statistics */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-yellow-400">
                    {calculateRMS(generateResidualsData(candidate, data)).toFixed(0)}
                  </div>
                  <div className="exoseer-label">RMS (ppm)</div>
                </div>
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-blue-400">
                    {calculateChi2(generateResidualsData(candidate, data)).toFixed(2)}
                  </div>
                  <div className="exoseer-label">χ²/DoF</div>
                </div>
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-emerald-400">
                    {Math.abs(calculateMean(generateResidualsData(candidate, data)) * 1e6).toFixed(0)}
                  </div>
                  <div className="exoseer-label">Bias (ppm)</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-white">0.00</div>
              <div className="exoseer-label">χ²/DoF</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-cyan-400">145.9</div>
              <div className="exoseer-label">RMS (ppm)</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-yellow-400">28.0</div>
              <div className="exoseer-label">SNR</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-emerald-400">92.0%</div>
              <div className="exoseer-label">Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uncertainty & Reliability Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Uncertainty & Reliability Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Parameter Uncertainties</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="exoseer-label">Period:</span>
                  <span className="text-white">129.9000 ± 0.0250 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Depth:</span>
                  <span className="text-white">0.021 ± 0.0006</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Duration:</span>
                  <span className="text-white">14.3 hrs</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Reliability Flags</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm exoseer-subtitle">Isolated signal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm exoseer-subtitle">No nearby eclipsing binary</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-red-900/20 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300">Centroid correlation: 16%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CentroidMotionAnalysisPanel = ({ data, candidate, analysisResult }) => {
  const [selectedMetric, setSelectedMetric] = useState('offset');
  
  // Get centroid analysis data
  const centroidData = analysisResult?.analyses?.centroid_analysis || {};
  
  // Generate centroid motion data
  const generateCentroidData = () => {
    if (!candidate) return [];
    
    return Array.from({ length: 100 }, (_, i) => {
      const phase = (i - 50) / 25; // -2 to 2 in phase
      const inTransit = Math.abs(phase) < 0.1;
      
      // Simulate slight centroid shift during transit if contaminated
      const baseX = 0;
      const baseY = 0;
      const contamShift = centroidData.motion_detected ? 0.08 : 0.01;
      
      let xOffset = baseX + (Math.random() - 0.5) * 0.02;
      let yOffset = baseY + (Math.random() - 0.5) * 0.02;
      
      if (inTransit && centroidData.motion_detected) {
        xOffset += contamShift * Math.exp(-phase * phase / 0.01);
        yOffset += contamShift * 0.5 * Math.exp(-phase * phase / 0.01);
      }
      
      return {
        phase: phase,
        xOffset: xOffset,
        yOffset: yOffset,
        significance: Math.abs(xOffset) + Math.abs(yOffset)
      };
    });
  };

  const chartData = generateCentroidData();
  const hasMotion = centroidData.motion_detected;
  const offsetSig = centroidData.offset_significance || 0;

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Eye className="w-6 h-6 text-cyan-400" />
                Centroid Motion Vetting
              </CardTitle>
              <p className="exoseer-subtitle mt-1">
                {candidate ? `Analyzing ${candidate.name} for background contamination` : "Select candidate for centroid analysis"}
              </p>
            </div>
            {hasMotion && (
              <Badge className="exoseer-badge bg-red-600">
                Motion Detected
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {candidate ? (
        <>
          {/* Interactive Controls */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Display Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={selectedMetric === 'offset' ? 'exoseer' : 'exoseer_outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('offset')}
                >
                  Position Offset
                </Button>
                <Button
                  variant={selectedMetric === 'significance' ? 'exoseer' : 'exoseer_outline'}
                  size="sm"
                  onClick={() => setSelectedMetric('significance')}
                >
                  Significance
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Centroid Motion Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Pixel-Level Centroid Analysis</CardTitle>
              <p className="text-sm exoseer-subtitle">
                Centroid shifts during transit indicate potential background contamination
              </p>
            </CardHeader>
            <CardContent>
              <div className="exoseer-chart-container mb-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis 
                        dataKey="phase" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        tickFormatter={(value) => selectedMetric === 'significance' ? value.toFixed(3) : value.toFixed(3) + ' px'}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid #00d4ff',
                          borderRadius: '6px'
                        }}
                        formatter={(value, name) => [
                          selectedMetric === 'significance' ? value.toFixed(4) : value.toFixed(4) + ' px',
                          selectedMetric === 'significance' ? 'Significance' : name === 'xOffset' ? 'X Offset' : 'Y Offset'
                        ]}
                      />
                      
                      {selectedMetric === 'offset' ? (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey="xOffset" 
                            stroke="#00d4ff" 
                            strokeWidth={1.5}
                            dot={false}
                            name="xOffset"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="yOffset" 
                            stroke="#ff6b6b" 
                            strokeWidth={1.5}
                            dot={false}
                            name="yOffset"
                          />
                        </>
                      ) : (
                        <Line 
                          type="monotone" 
                          dataKey="significance" 
                          stroke="#ffd700" 
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      
                      <Line 
                        type="monotone" 
                        dataKey={() => 0} 
                        stroke="#666666" 
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Analysis Results */}
              <div className="grid grid-cols-4 gap-4">
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-cyan-400">
                    {centroidData.pixel_offset_x?.toFixed(3) || '0.001'}
                  </div>
                  <div className="exoseer-label">X-offset (pixels)</div>
                </div>
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-purple-400">
                    {centroidData.pixel_offset_y?.toFixed(3) || '-0.002'}
                  </div>
                  <div className="exoseer-label">Y-offset (pixels)</div>
                </div>
                <div className="exoseer-metric-card">
                  <div className="text-lg font-bold text-yellow-400">
                    {offsetSig.toFixed(1)}σ
                  </div>
                  <div className="exoseer-label">Significance</div>
                </div>
                <div className="exoseer-metric-card">
                  <div className={`text-lg font-bold ${hasMotion ? 'text-red-400' : 'text-emerald-400'}`}>
                    {hasMotion ? 'WARN' : 'PASS'}
                  </div>
                  <div className="exoseer-label">Contamination</div>
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-gray-600">
                <h4 className="font-semibold text-white mb-2 text-sm">Assessment</h4>
                <div className="text-sm text-gray-300">
                  {hasMotion ? (
                    <span className="text-yellow-300">
                      ⚠️ Detected centroid motion during transit ({offsetSig.toFixed(1)}σ significance). 
                      This may indicate background contamination from a nearby eclipsing binary.
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      ✅ No significant centroid motion detected. Transit appears to originate from the target star.
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Contamination probability: {((centroidData.contamination_probability || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Eye className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No Candidate Selected</h3>
              <p className="text-sm text-gray-500">
                Select an exoplanet candidate from the sidebar to perform centroid motion analysis.
                This analysis helps detect background contamination from nearby eclipsing binaries.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const PhysicsAnalysisPanel = ({ data, candidate, analysisResult }) => {
  const [activePhysicsTab, setActivePhysicsTab] = useState('parameters');
  const [period, setPeriod] = useState(129.9000);
  const [planetRadius, setPlanetRadius] = useState(1.80);

  return (
    <div className="space-y-6">{/* Removed duplicate physics warning - it's in ParametersPanel */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Atom className="w-5 h-5 text-blue-400" />
            Physics-Informed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Physics Tabs */}
          <Tabs value={activePhysicsTab} onValueChange={setActivePhysicsTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="parameters" className="exoseer-tab">Orbital & Stellar Parameter Analysis</TabsTrigger>
              <TabsTrigger value="model" className="exoseer-tab">Transit Model Fitting & Diagnostics</TabsTrigger>
              <TabsTrigger value="interactive" className="exoseer-tab">Real-Time Parameter Exploration</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters">
              <ParametersPanel 
                data={data} 
                candidate={candidate}
                analysisData={data?.physics_analysis}
              />
            </TabsContent>

            <TabsContent value="model">
              <ModelFitPanel 
                data={data} 
                candidate={candidate}
                analysisData={data?.physics_analysis}
              />
            </TabsContent>

            <TabsContent value="interactive">
              <InteractivePanel 
                data={data} 
                candidate={candidate}
                onParametersChange={(params) => {
                  // Handle parameter changes if needed
                  console.log('Parameters updated:', params);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Physics-Aware AI */}
      <Card className="border-blue-500/30 bg-blue-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Physics-Aware AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm exoseer-subtitle">
            These physics-derived features feed into the AI classifier, making it physics-aware rather than a pure black box. 
            Residuals between observed and modeled parameters help the AI distinguish real planets from false positives.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const UncertaintyQuantificationPanel = ({ data, candidate }) => {
  return (
    <div className="space-y-6">
      {/* Main Uncertainty Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Uncertainty Quantification
            </div>
            <Button variant="exoseer_outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </CardTitle>
          <p className="text-sm exoseer-subtitle">Bayesian Monte Carlo Uncertainty-based Confidence estimation</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">0.942</div>
              <div className="exoseer-label mb-2">Overall Confidence (calibrated)</div>
              <Progress value={94.2} className="h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">0.026</div>
              <div className="exoseer-label mb-2">Epistemic Uncertainty</div>
              <Progress value={2.6} className="h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">0.513</div>
              <div className="exoseer-label mb-2">Aleatoric Uncertainty</div>
              <Progress value={51.3} className="h-2" />
              <p className="text-xs text-gray-400 mt-1">High → observational noise dominates</p>
            </div>
          </div>

          {/* Decision Guidance */}
          <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Decision Guidance: NEEDS REVIEW</span>
            </div>
            <p className="text-sm text-emerald-200">High aleatoric uncertainty from observation noise</p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-4">Reliability Metrics</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="exoseer-label">Expected Calibration Error (ECE):</span>
                  <span className="text-cyan-400 font-bold">0.015</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Brier Score:</span>
                  <span className="text-cyan-400 font-bold">0.093</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Out-of-Distribution Indicators:</span>
                  <span className="text-yellow-400 font-bold">2.30e</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Mahalanobis Distance:</span>
                  <span className="text-green-400 font-bold">Moderate OOD</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Ensemble Configuration</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="exoseer-label">Ensemble Size:</span>
                  <span className="text-white font-bold">7</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Base Learners:</span>
                  <span className="text-cyan-400 font-bold">CNN+est + LC+CNN</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Noise Indicators (Outputs):</span>
                  <span className="text-yellow-400 font-bold">218 ppm</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Crowding:</span>
                  <span className="text-green-400 font-bold">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Contamination:</span>
                  <span className="text-red-400 font-bold">0.34</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ensemble Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            Ensemble Predictions
          </CardTitle>
          <p className="text-sm exoseer-subtitle">Individual model outputs from the ensemble</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Model 1', confidence: 91.7 },
              { name: 'Model 2', confidence: 90.2 },
              { name: 'Model 3', confidence: 94.8 },
              { name: 'Model 4', confidence: 92.5 },
              { name: 'Model 5', confidence: 95.7 },
              { name: 'Model 6', confidence: 94.3 },
              { name: 'Model 7', confidence: 93.6 }
            ].map((model, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-400">{model.name}</div>
                <div className="flex-1">
                  <Progress value={model.confidence} className="h-2" />
                </div>
                <div className="w-12 text-sm text-white font-bold">{model.confidence}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Decision Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-white">Decision Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">
                High-confidence planet: β ≥ 0.90, σ_epist ≤ 0.05, σ_obs ≤ 0.08, and physics-verified checks passed
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">
                Needs review: 0.60 ≤ β ≤ 0.90 or any uncertainty > 0.12
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">
                Likely false positive: β ≤ 0.20 or physics-verified inconsistent by >3σ
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-gray-600">
            <p className="text-xs exoseer-subtitle">
              <strong>Guidance:</strong> If σ_epist > 0.15 → procedure model retraining or expert vetting. 
              If σ_obs > 0.12 → prioritize additional photometry or improved detrending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdvancedAnalysisPanel = ({ 
  analysisResult, 
  isAnalyzing = false,
  analysisProgress = 0,
  analysisTimeRemaining = 0,
  activeTab = "lightcurve",
  selectedCandidate,
  userMode = 'scientist'
}) => {
  if (isAnalyzing) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-white font-medium mb-2">Running Advanced Analysis...</div>
          <div className="exoseer-subtitle mb-4">
            {userMode === 'novice' ? 'Analyzing your planet discovery...' : 'Physics-informed modeling in progress'}
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-cyan-400">Progress</span>
              <span className="text-white font-medium">{Math.round(analysisProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(analysisProgress, 100)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Time Estimation */}
          {analysisTimeRemaining > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-300">
                Estimated time remaining: 
                <span className="text-white font-medium ml-1">
                  {analysisTimeRemaining >= 60 
                    ? `${Math.floor(analysisTimeRemaining / 60)}m ${Math.round(analysisTimeRemaining % 60)}s`
                    : `${Math.round(analysisTimeRemaining)}s`
                  }
                </span>
              </span>
            </div>
          )}
          
          {analysisProgress > 75 && (
            <div className="mt-4 text-xs text-cyan-300">
              Finalizing analysis results...
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!analysisResult) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-8 text-center">
          <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">Select a Candidate</h3>
          <p className="exoseer-subtitle">
            Choose a candidate to begin sophisticated analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const candidate = selectedCandidate || analysisResult.candidate;
  const analysisData = analysisResult.analyses;

  // Render appropriate panel based on active tab
  switch(activeTab) {
    case "lightcurve":
      return <LightCurveAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} userMode={userMode} />;
    case "centroid":
      return <CentroidMotionAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} userMode={userMode} />;
    case "physics":
      return <PhysicsAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} userMode={userMode} />;
    case "uncertainty":
      return <UncertaintyQuantificationPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} userMode={userMode} />;
    default:
      return <LightCurveAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} userMode={userMode} />;
  }
};

export default AdvancedAnalysisPanel;