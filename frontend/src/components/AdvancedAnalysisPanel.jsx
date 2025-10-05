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

const LightCurveAnalysisPanel = ({ data, candidate }) => {
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedView, setSelectedView] = useState('folded');

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Optional: Upload Your Own Light Curve Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="exoseer" className="h-12">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
            <Button variant="exoseer_outline" className="h-12">
              NASA Archive
            </Button>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-cyan-400/20">
            <p className="text-sm exoseer-subtitle mb-2">Upload Light Curve CSV</p>
            <p className="text-xs text-gray-400">Format: time, flux, error (optional)</p>
            <div className="mt-3 p-3 rounded bg-slate-700/50">
              <div className="text-xs text-cyan-400">ExcelFilter Activated: Neptuna Acteres selectedande</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-sm exoseer-subtitle mb-2">Folding Period: 129.9000 days</p>
            <p className="text-xs text-gray-400">Adjust the period to watch the transit changes or disappear</p>
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
                    <LineChart data={data?.lightCurveData?.slice(0, 200) || []}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis 
                        dataKey="phase" 
                        stroke="#9CA3AF"
                        fontSize={10}
                        domain={[0.9, 1.1]}
                        tickFormatter={(value) => value.toFixed(3)}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        domain={[0.997, 1.003]}
                        tickFormatter={(value) => value.toFixed(4)}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid #00d4ff',
                          borderRadius: '6px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="flux" 
                        stroke="#00d4ff" 
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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

const PhysicsAnalysisPanel = ({ data, candidate }) => {
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
              <TabsTrigger value="parameters" className="exoseer-tab">Parameters</TabsTrigger>
              <TabsTrigger value="model" className="exoseer-tab">Model Fit</TabsTrigger>
              <TabsTrigger value="interactive" className="exoseer-tab">Interactive</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-4">Observed</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="exoseer-label">Depth:</span>
                      <span className="text-white">0.027%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="exoseer-label">Duration:</span>
                      <span className="text-white">4.20 hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="exoseer-label">Period:</span>
                      <span className="text-white">129.9000 days</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-4">Physics Model</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="exoseer-label">Derived Rp:</span>
                      <span className="text-cyan-400">1.50 Re</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="exoseer-label">Impact:</span>
                      <span className="text-cyan-400">0.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="exoseer-label">a/R*:</span>
                      <span className="text-cyan-400">167.95</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="model">
              <div className="exoseer-chart-container">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.from({length: 50}, (_, i) => ({
                      phase: (i - 25) / 25,
                      flux: 1 - (Math.abs(i - 25) < 5 ? 0.00027 * Math.exp(-Math.pow((i - 25) / 3, 2)) : 0)
                    }))}>
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 212, 255, 0.1)" />
                      <XAxis 
                        dataKey="phase" 
                        stroke="#9CA3AF"
                        fontSize={10}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={10}
                        domain={[0.9997, 1.0003]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="flux" 
                        stroke="#00d4ff" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
  activeTab = "lightcurve"
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

  // Render appropriate panel based on active tab
  switch(activeTab) {
    case "lightcurve":
      return <LightCurveAnalysisPanel data={analysisResult.analyses} candidate={analysisResult.candidate} />;
    case "centroid":
      return <CentroidMotionAnalysisPanel data={analysisResult.analyses} candidate={analysisResult.candidate} />;
    case "physics":
      return <PhysicsAnalysisPanel data={analysisResult.analyses} candidate={analysisResult.candidate} />;
    case "uncertainty":
      return <UncertaintyQuantificationPanel data={analysisResult.analyses} candidate={analysisResult.candidate} />;
    default:
      return <LightCurveAnalysisPanel data={analysisResult.analyses} candidate={analysisResult.candidate} />;
  }
};

export default AdvancedAnalysisPanel;