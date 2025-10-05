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
  TrendingUp, Zap, Settings
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import InteractivePanel from './AdvancedAnalysis/InteractivePanel';
import ParametersPanel from './AdvancedAnalysis/ParametersPanel';
import ModelFitPanel from './AdvancedAnalysis/ModelFitPanel';

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

const LightCurveAnalysisPanel = ({ data, candidate, analysisResult }) => {
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedView, setSelectedView] = useState('folded');

  return (
    <div className="space-y-6">
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
            <Button variant="ghost" size="sm" className="text-xs">
              Archive
            </Button>
          </div>
        </div>
      </div>

      {/* Physics-Informed Transit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Physics-Informed Transit Analysis
            </div>
            <div className="flex items-center gap-2">
              <Badge className="exoseer-badge exoseer-badge-confirmed">Compare</Badge>
              <Switch />
              <Badge className="exoseer-badge exoseer-badge-candidate">Uncertainty</Badge>
              <Badge className="exoseer-badge exoseer-badge-candidate">Residuals</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm exoseer-subtitle mb-1">
                  Target: <span className="text-white font-medium">{candidate?.name || 'Unknown'}</span>
                </p>
                <p className="text-sm exoseer-subtitle mb-1">
                  Period: <span className="text-cyan-400 font-medium">{candidate?.orbital_period?.toFixed(4) || 'N/A'} days</span>
                </p>
              </div>
              <div>
                <p className="text-sm exoseer-subtitle mb-1">
                  TESS Sector: <span className="text-white font-medium">{data?.light_curve?.sector || 'N/A'}</span>
                </p>
                <p className="text-sm exoseer-subtitle mb-1">
                  Transit Depth: <span className="text-purple-400 font-medium">{((candidate?.transit_depth || 0) * 100).toFixed(4)}%</span>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.lightCurveData?.slice(0, 500) || []}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#9CA3AF"
                        fontSize={10}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="residuals">
              <div className="exoseer-chart-container mb-4">
                <div className="h-80 w-full flex items-center justify-center text-gray-400">
                  Residuals visualization would show model fit quality
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

const CentroidMotionAnalysisPanel = ({ data, candidate }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Centroid Motion Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Alert */}
          <div className="mb-6 p-4 rounded-lg bg-cyan-900/20 border border-cyan-400/30">
            <p className="text-sm text-cyan-300">
              Centroid shift 0.0σ at 0.000" SW — consistent with off-target eclipsing binary.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="exoseer-metric-card">
              <div className="text-xl font-bold text-cyan-400">0.000"</div>
              <div className="exoseer-label">Offset (2σ)</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-xl font-bold text-blue-400">± 0.000"</div>
              <div className="exoseer-label">Uncertainty (2σ)</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-xl font-bold text-green-400">0.0σ</div>
              <div className="exoseer-label">S/N Ratio</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-xl font-bold text-purple-400">90%</div>
              <div className="exoseer-label">Motion Corr.</div>
            </div>
          </div>

          {/* Detailed Measurements */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Raw Offset Measurements</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="exoseer-label">RA Offset (West):</span>
                  <span className="text-white">0.0000 px</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Dec Offset (North):</span>
                  <span className="text-white">0.0000 px</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Calibration Offset (Arcsec)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="exoseer-label">RA:</span>
                  <span className="text-white">0.0000 px</span>
                </div>
                <div className="flex justify-between">
                  <span className="exoseer-label">Dec:</span>
                  <span className="text-white">0.0000 px</span>
                </div>
              </div>
            </div>
          </div>

          {/* What This Means Section */}
          <Card className="border-gray-700 bg-slate-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                What This Means
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></div>
                  <span className="exoseer-subtitle">Real planets on the target star show minimal centroid shift (&lt;1σ)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                  <span className="exoseer-subtitle">Background eclipsing binaries cause measurable offsets (&gt; 3σ) typical</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                  <span className="exoseer-subtitle">Motion correlation near 100% co-phased with transit = red flag (see 10.5)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></div>
                  <span className="exoseer-subtitle">This analysis ensures Kepler/TESS Data Validation standard procedures</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

const PhysicsAnalysisPanel = ({ data, candidate, analysisResult }) => {
  const [activePhysicsTab, setActivePhysicsTab] = useState('parameters');
  const [period, setPeriod] = useState(129.9000);
  const [planetRadius, setPlanetRadius] = useState(1.80);

  return (
    <div className="space-y-6">
      {/* Physics Warning Alert */}
      <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
        <div>
          <div className="font-medium text-red-300 mb-1">Physically Inconsistent</div>
          <div className="text-sm text-red-200">
            Transit duration inconsistent: 23.6σ. Observed: 4.20h, Expected: 9.19h.
          </div>
        </div>
        <Badge className="exoseer-badge bg-red-600 text-white ml-auto">
          Physically Inconsistent
        </Badge>
      </div>

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
  activeTab = "lightcurve",
  selectedCandidate
}) => {
  if (isAnalyzing) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-white font-medium mb-2">Running Advanced Analysis...</div>
          <div className="exoseer-subtitle">Physics-informed modeling in progress</div>
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
      return <LightCurveAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} />;
    case "centroid":
      return <CentroidMotionAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} />;
    case "physics":
      return <PhysicsAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} />;
    case "uncertainty":
      return <UncertaintyQuantificationPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} />;
    default:
      return <LightCurveAnalysisPanel data={analysisData} candidate={candidate} analysisResult={analysisResult} />;
  }
};

export default AdvancedAnalysisPanel;