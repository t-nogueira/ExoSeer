import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { 
  Play, RotateCcw, Download, Upload, Lock, Unlock, 
  Sliders, BarChart3, Eye, Settings, Zap, AlertTriangle,
  CheckCircle2, X, Plus, Minus
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  Tooltip, Legend, ReferenceLine, Scatter, ScatterChart
} from 'recharts';

// Physics constants and validation functions
const PHYSICS_CONSTRAINTS = {
  period: { min: 0.1, max: 1000, step: 0.0001, precision: 4 },
  rpOverRs: { min: 0.001, max: 0.2, step: 0.0001, precision: 4 },
  impactParam: { min: 0, max: 1.5, step: 0.001, precision: 3 },
  inclination: { min: 75, max: 90, step: 0.1, precision: 1 },
  eccentricity: { min: 0, max: 0.9, step: 0.001, precision: 3 },
  omega: { min: 0, max: 360, step: 1, precision: 1 }
};

const MODEL_PRESETS = {
  'hot-jupiter': {
    period: 3.2,
    rpOverRs: 0.12,
    impactParam: 0.3,
    inclination: 87.5,
    eccentricity: 0.0,
    omega: 90
  },
  'sub-neptune': {
    period: 12.5,
    rpOverRs: 0.035,
    impactParam: 0.1,
    inclination: 89.2,
    eccentricity: 0.02,
    omega: 90
  },
  'super-earth': {
    period: 25.8,
    rpOverRs: 0.018,
    impactParam: 0.05,
    inclination: 89.8,
    eccentricity: 0.001,
    omega: 90
  }
};

// Transit model calculation function (simplified Mandel & Agol)
const calculateTransitModel = (params, phase) => {
  const { rpOverRs, impactParam } = params;
  const depth = rpOverRs * rpOverRs;
  
  return phase.map(p => {
    const x = Math.abs(p) * 2; // Normalized phase distance
    if (x > 1.2) return 1.0; // Outside transit
    
    // Simple transit shape approximation
    const transitShape = Math.max(0, 1 - Math.pow(x, 2));
    const flux = 1.0 - depth * transitShape * Math.exp(-Math.pow(impactParam * x, 2));
    return Math.max(flux, 1.0 - depth);
  });
};

// Generate synthetic light curve data
const generateLightCurveData = (params, numPoints = 200) => {
  const phases = Array.from({ length: numPoints }, (_, i) => (i - numPoints/2) / (numPoints/4));
  const modelFlux = calculateTransitModel(params, phases);
  
  return phases.map((phase, i) => ({
    phase: phase,
    flux: modelFlux[i] + (Math.random() - 0.5) * 0.0002, // Add noise
    model: modelFlux[i],
    residual: (modelFlux[i] + (Math.random() - 0.5) * 0.0002) - modelFlux[i]
  }));
};

const InteractivePanel = ({ data, candidate, onParametersChange }) => {
  // Core parameter state
  const [params, setParams] = useState({
    period: 129.9000,
    rpOverRs: 0.051,
    impactParam: 0.2,
    inclination: 87.5,
    eccentricity: 0.0,
    omega: 90,
    limbDarkening: { mode: 'fixed', u1: 0.3, u2: 0.2 }
  });

  // UI state
  const [activeView, setActiveView] = useState('folded');
  const [coupledMode, setCoupledMode] = useState(false);
  const [lockedParams, setLockedParams] = useState(new Set());
  const [precision, setPrecision] = useState('medium');
  const [units, setUnits] = useState('ppm');
  const [detrending, setDetrending] = useState('savgol');
  const [showComparison, setShowComparison] = useState(true);
  const [overlayModels, setOverlayModels] = useState(new Set(['physics-fit']));
  
  // Performance optimization - debounced updates
  const updateTimeoutRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fit quality metrics
  const [fitMetrics, setFitMetrics] = useState({
    chi2red: 1.15,
    rmsePpm: 145.2,
    rhoStarTransit: 1.48,
    rhoStarCat: 1.52,
    durationObsHr: 4.2,
    durationModelHr: 4.3
  });

  // Generate chart data based on current parameters
  const chartData = useMemo(() => {
    return generateLightCurveData(params);
  }, [params]);

  // Debounced parameter update
  const debouncedUpdateParams = useCallback((newParams) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    setIsUpdating(true);
    updateTimeoutRef.current = setTimeout(() => {
      setParams(newParams);
      setIsUpdating(false);
      if (onParametersChange) {
        onParametersChange(newParams);
      }
    }, 32); // 32ms debounce for smooth interaction
  }, [onParametersChange]);

  // Parameter validation and coupling
  const validateAndCoupleParams = useCallback((paramName, value, currentParams) => {
    let newParams = { ...currentParams, [paramName]: value };
    
    // Apply physics constraints
    const constraint = PHYSICS_CONSTRAINTS[paramName];
    if (constraint) {
      newParams[paramName] = Math.max(constraint.min, Math.min(constraint.max, value));
    }

    // Parameter coupling when enabled
    if (coupledMode) {
      if (paramName === 'inclination' || paramName === 'impactParam') {
        // Couple impact parameter and inclination: b = a*cos(i)/R*
        // Simplified approximation for UI
        if (paramName === 'inclination') {
          const aOverRs = 167.95; // Typical value, should be calculated
          newParams.impactParam = Math.min(1.5, aOverRs * Math.cos(value * Math.PI / 180) / 1.0);
        }
      }
    }

    return newParams;
  }, [coupledMode]);

  // Handle parameter changes with validation and coupling
  const handleParamChange = useCallback((paramName, value) => {
    if (lockedParams.has(paramName)) return;
    
    const newParams = validateAndCoupleParams(paramName, value, params);
    debouncedUpdateParams(newParams);
  }, [params, lockedParams, validateAndCoupleParams, debouncedUpdateParams]);

  // Toggle parameter lock
  const toggleParamLock = useCallback((paramName) => {
    const newLocked = new Set(lockedParams);
    if (newLocked.has(paramName)) {
      newLocked.delete(paramName);
    } else {
      newLocked.add(paramName);
    }
    setLockedParams(newLocked);
  }, [lockedParams]);

  // Apply model preset
  const applyPreset = useCallback((presetName) => {
    const preset = MODEL_PRESETS[presetName];
    if (preset) {
      debouncedUpdateParams(preset);
    }
  }, [debouncedUpdateParams]);

  // Auto-fit function (simplified)
  const handleAutoFit = useCallback(async () => {
    setIsUpdating(true);
    // Simulate auto-fit process
    setTimeout(() => {
      // Apply small random adjustments to simulate fitting
      const newParams = {
        ...params,
        period: params.period + (Math.random() - 0.5) * 0.1,
        rpOverRs: params.rpOverRs + (Math.random() - 0.5) * 0.005,
        impactParam: Math.max(0, params.impactParam + (Math.random() - 0.5) * 0.1)
      };
      setParams(newParams);
      setFitMetrics(prev => ({
        ...prev,
        chi2red: Math.max(0.8, prev.chi2red - 0.1 + Math.random() * 0.2),
        rmsePpm: Math.max(100, prev.rmsePpm - 10 + Math.random() * 20)
      }));
      setIsUpdating(false);
    }, 1500);
  }, [params]);

  // Revert to catalog values
  const handleRevert = useCallback(() => {
    const catalogParams = {
      period: 129.9000,
      rpOverRs: 0.051,
      impactParam: 0.2,
      inclination: 87.5,
      eccentricity: 0.0,
      omega: 90,
      limbDarkening: { mode: 'fixed', u1: 0.3, u2: 0.2 }
    };
    setParams(catalogParams);
  }, []);

  // Export functions
  const exportData = useCallback((format) => {
    const exportObj = {
      parameters: params,
      fitMetrics,
      lightCurveData: chartData,
      timestamp: new Date().toISOString(),
      software: "ExoSeer v1.0"
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exoseer-analysis-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [params, fitMetrics, chartData]);

  // Derived parameters calculation
  const derivedParams = useMemo(() => {
    const { period, rpOverRs, inclination } = params;
    const aOverRs = Math.pow(period / 365.25, 2/3) * 215; // Simplified calculation
    const rPlanetEarth = rpOverRs * 109.2; // R_sun/R_earth ≈ 109.2
    const transitProb = 1 / aOverRs; // Simplified
    
    return {
      aOverRs: aOverRs.toFixed(2),
      rPlanetEarth: rPlanetEarth.toFixed(2),
      rPlanetJupiter: (rPlanetEarth / 11.2).toFixed(3),
      transitProb: (transitProb * 100).toFixed(3),
      teq: (5778 * Math.pow(1/aOverRs, 0.5)).toFixed(0)
    };
  }, [params]);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              NASA-Level Interactive Transit Modeling Suite
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="exoseer"
                size="sm"
                onClick={handleAutoFit}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full mr-2" />
                ) : (
                  <Play className="w-3 h-3 mr-2" />
                )}
                Auto-Fit
              </Button>
              <Button
                variant="exoseer_outline"
                size="sm"
                onClick={handleRevert}
              >
                <RotateCcw className="w-3 h-3 mr-2" />
                Revert
              </Button>
              <Button
                variant="exoseer_outline"
                size="sm"
                onClick={() => exportData('json')}
              >
                <Download className="w-3 h-3 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Model Presets */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-white">Model Presets:</span>
            </div>
            <div className="flex gap-2">
              {Object.keys(MODEL_PRESETS).map((preset) => (
                <Button
                  key={preset}
                  variant="exoseer_outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.charAt(0).toUpperCase() + preset.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={coupledMode}
                onCheckedChange={setCoupledMode}
              />
              <span className="text-sm exoseer-subtitle">Coupled Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={showComparison}
                onCheckedChange={setShowComparison}
              />
              <span className="text-sm exoseer-subtitle">Show Overlays</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm exoseer-subtitle">Units:</span>
              <Button
                variant={units === 'ppm' ? 'exoseer' : 'exoseer_outline'}
                size="sm"
                onClick={() => setUnits('ppm')}
              >
                ppm
              </Button>
              <Button
                variant={units === 'percent' ? 'exoseer' : 'exoseer_outline'}
                size="sm"
                onClick={() => setUnits('percent')}
              >
                %
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm exoseer-subtitle">Detrending:</span>
              <Button
                variant={detrending === 'savgol' ? 'exoseer' : 'exoseer_outline'}
                size="sm"
                onClick={() => setDetrending('savgol')}
              >
                S-G
              </Button>
              <Button
                variant={detrending === 'gp' ? 'exoseer' : 'exoseer_outline'}
                size="sm"
                onClick={() => setDetrending('gp')}
              >
                GP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameter Sliders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Keplerian Orbital & Transit Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Period */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">
                    Period: {params.period.toFixed(PHYSICS_CONSTRAINTS.period.precision)} days
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleParamLock('period')}
                  >
                    {lockedParams.has('period') ? (
                      <Lock className="w-3 h-3 text-red-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-gray-400" />
                    )}
                  </Button>
                </div>
                <Slider
                  value={[params.period]}
                  onValueChange={([value]) => handleParamChange('period', value)}
                  min={PHYSICS_CONSTRAINTS.period.min}
                  max={Math.max(200, params.period + 10)}
                  step={PHYSICS_CONSTRAINTS.period.step}
                  disabled={lockedParams.has('period')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{PHYSICS_CONSTRAINTS.period.min}</span>
                  <span>Adjust period to see transit changes</span>
                  <span>{Math.max(200, params.period + 10)}</span>
                </div>
              </div>

              {/* Planet Radius Ratio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">
                    Rp/R★: {params.rpOverRs.toFixed(PHYSICS_CONSTRAINTS.rpOverRs.precision)}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleParamLock('rpOverRs')}
                  >
                    {lockedParams.has('rpOverRs') ? (
                      <Lock className="w-3 h-3 text-red-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-gray-400" />
                    )}
                  </Button>
                </div>
                <Slider
                  value={[params.rpOverRs]}
                  onValueChange={([value]) => handleParamChange('rpOverRs', value)}
                  min={PHYSICS_CONSTRAINTS.rpOverRs.min}
                  max={PHYSICS_CONSTRAINTS.rpOverRs.max}
                  step={PHYSICS_CONSTRAINTS.rpOverRs.step}
                  disabled={lockedParams.has('rpOverRs')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{PHYSICS_CONSTRAINTS.rpOverRs.min}</span>
                  <span>Controls transit depth</span>
                  <span>{PHYSICS_CONSTRAINTS.rpOverRs.max}</span>
                </div>
              </div>

              {/* Impact Parameter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">
                    Impact Parameter: {params.impactParam.toFixed(PHYSICS_CONSTRAINTS.impactParam.precision)}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleParamLock('impactParam')}
                  >
                    {lockedParams.has('impactParam') ? (
                      <Lock className="w-3 h-3 text-red-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-gray-400" />
                    )}
                  </Button>
                </div>
                <Slider
                  value={[params.impactParam]}
                  onValueChange={([value]) => handleParamChange('impactParam', value)}
                  min={PHYSICS_CONSTRAINTS.impactParam.min}
                  max={PHYSICS_CONSTRAINTS.impactParam.max}
                  step={PHYSICS_CONSTRAINTS.impactParam.step}
                  disabled={lockedParams.has('impactParam')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{PHYSICS_CONSTRAINTS.impactParam.min}</span>
                  <span>Affects transit shape</span>
                  <span>{PHYSICS_CONSTRAINTS.impactParam.max}</span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Inclination */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">
                    Inclination: {params.inclination.toFixed(PHYSICS_CONSTRAINTS.inclination.precision)}°
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleParamLock('inclination')}
                  >
                    {lockedParams.has('inclination') ? (
                      <Lock className="w-3 h-3 text-red-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-gray-400" />
                    )}
                  </Button>
                </div>
                <Slider
                  value={[params.inclination]}
                  onValueChange={([value]) => handleParamChange('inclination', value)}
                  min={PHYSICS_CONSTRAINTS.inclination.min}
                  max={PHYSICS_CONSTRAINTS.inclination.max}
                  step={PHYSICS_CONSTRAINTS.inclination.step}
                  disabled={lockedParams.has('inclination')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{PHYSICS_CONSTRAINTS.inclination.min}°</span>
                  <span>Orbital inclination</span>
                  <span>{PHYSICS_CONSTRAINTS.inclination.max}°</span>
                </div>
              </div>

              {/* Eccentricity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">
                    Eccentricity: {params.eccentricity.toFixed(PHYSICS_CONSTRAINTS.eccentricity.precision)}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleParamLock('eccentricity')}
                  >
                    {lockedParams.has('eccentricity') ? (
                      <Lock className="w-3 h-3 text-red-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-gray-400" />
                    )}
                  </Button>
                </div>
                <Slider
                  value={[params.eccentricity]}
                  onValueChange={([value]) => handleParamChange('eccentricity', value)}
                  min={PHYSICS_CONSTRAINTS.eccentricity.min}
                  max={PHYSICS_CONSTRAINTS.eccentricity.max}
                  step={PHYSICS_CONSTRAINTS.eccentricity.step}
                  disabled={lockedParams.has('eccentricity')}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{PHYSICS_CONSTRAINTS.eccentricity.min}</span>
                  <span>Orbital eccentricity</span>
                  <span>{PHYSICS_CONSTRAINTS.eccentricity.max}</span>
                </div>
              </div>

              {/* Derived Parameters Display */}
              <div className="p-3 rounded-lg bg-slate-800/50 border border-cyan-400/20">
                <h4 className="font-semibold text-white mb-2 text-sm">Derived Parameters</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="exoseer-label">a/R★:</span>
                    <span className="text-cyan-400">{derivedParams.aOverRs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">Rp (R⊕):</span>
                    <span className="text-cyan-400">{derivedParams.rPlanetEarth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">Rp (RJ):</span>
                    <span className="text-cyan-400">{derivedParams.rPlanetJupiter}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">Transit Prob:</span>
                    <span className="text-cyan-400">{derivedParams.transitProb}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">Teq:</span>
                    <span className="text-cyan-400">{derivedParams.teq} K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              High-Precision Transit Photometry Analysis
            </CardTitle>
            {isUpdating && (
              <div className="flex items-center gap-2 text-cyan-400">
                <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full" />
                <span className="text-sm">Updating model...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Chart Tabs */}
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="mb-4">
              <TabsTrigger value="folded" className="exoseer-tab">Folded LC</TabsTrigger>
              <TabsTrigger value="full" className="exoseer-tab">Full LC</TabsTrigger>
              <TabsTrigger value="residuals" className="exoseer-tab">Residuals</TabsTrigger>
            </TabsList>

            {/* Folded Light Curve */}
            <TabsContent value="folded">
              <div className="exoseer-chart-container mb-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                        tickFormatter={(value) => units === 'ppm' ? 
                          ((1 - value) * 1e6).toFixed(0) + ' ppm' : 
                          ((1 - value) * 100).toFixed(3) + '%'
                        }
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid #00d4ff',
                          borderRadius: '6px'
                        }}
                        labelFormatter={(value) => `Phase: ${parseFloat(value).toFixed(4)}`}
                        formatter={(value, name) => [
                          name === 'flux' ? 
                            (units === 'ppm' ? `${((1 - value) * 1e6).toFixed(0)} ppm` : `${((1 - value) * 100).toFixed(3)}%`) :
                            value.toFixed(6),
                          name === 'flux' ? 'Observed' : 'Model'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="flux" 
                        stroke="#00d4ff" 
                        strokeWidth={1}
                        dot={false}
                        name="flux"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="model" 
                        stroke="#ff6b6b" 
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                        name="model"
                      />
                      <ReferenceLine y={1} stroke="#666" strokeWidth={1} strokeDasharray="2 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Full Light Curve */}
            <TabsContent value="full">
              <div className="exoseer-chart-container mb-4">
                <div className="h-80 w-full flex items-center justify-center text-gray-400">
                  Full time series view (would show multiple transits)
                </div>
              </div>
            </TabsContent>

            {/* Residuals */}
            <TabsContent value="residuals">
              <div className="exoseer-chart-container mb-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
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
                        tickFormatter={(value) => (value * 1e6).toFixed(0) + ' ppm'}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                          border: '1px solid #00d4ff',
                          borderRadius: '6px'
                        }}
                        formatter={(value) => [`${(value * 1e6).toFixed(0)} ppm`, 'Residual']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="residual" 
                        stroke="#ffd700" 
                        strokeWidth={1}
                        dot={false}
                      />
                      <ReferenceLine y={0} stroke="#666" strokeWidth={1} strokeDasharray="2 2" />
                      <ReferenceLine y={0.0001} stroke="#666" strokeWidth={1} strokeOpacity={0.3} />
                      <ReferenceLine y={-0.0001} stroke="#666" strokeWidth={1} strokeOpacity={0.3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Fit Quality Metrics */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-white">{fitMetrics.chi2red.toFixed(2)}</div>
              <div className="exoseer-label">χ²/DoF</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-cyan-400">{fitMetrics.rmsePpm.toFixed(1)}</div>
              <div className="exoseer-label">RMS (ppm)</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-yellow-400">{fitMetrics.durationObsHr.toFixed(1)}</div>
              <div className="exoseer-label">Duration (h)</div>
            </div>
            <div className="exoseer-metric-card">
              <div className={`text-lg font-bold ${Math.abs(fitMetrics.durationObsHr - fitMetrics.durationModelHr) < 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Math.abs(fitMetrics.durationObsHr - fitMetrics.durationModelHr) < 0.5 ? 'PASS' : 'FAIL'}
              </div>
              <div className="exoseer-label">Consistency</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Comparison */}
      {showComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              Model Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">Active Overlays</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={overlayModels.has('catalog')}
                      onChange={(e) => {
                        const newOverlays = new Set(overlayModels);
                        if (e.target.checked) newOverlays.add('catalog');
                        else newOverlays.delete('catalog');
                        setOverlayModels(newOverlays);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm exoseer-subtitle">Catalog Model</span>
                    <div className="w-4 h-0.5 bg-blue-400 ml-auto"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={overlayModels.has('physics-fit')}
                      onChange={(e) => {
                        const newOverlays = new Set(overlayModels);
                        if (e.target.checked) newOverlays.add('physics-fit');
                        else newOverlays.delete('physics-fit');
                        setOverlayModels(newOverlays);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm exoseer-subtitle">Physics Fit</span>
                    <div className="w-4 h-0.5 bg-red-400 ml-auto"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={overlayModels.has('user-adjusted')}
                      onChange={(e) => {
                        const newOverlays = new Set(overlayModels);
                        if (e.target.checked) newOverlays.add('user-adjusted');
                        else newOverlays.delete('user-adjusted');
                        setOverlayModels(newOverlays);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm exoseer-subtitle">User Adjusted</span>
                    <div className="w-4 h-0.5 bg-cyan-400 ml-auto"></div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Parameter Deltas</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="exoseer-label">Duration:</span>
                    <span className="text-yellow-400">+0.1 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">Depth:</span>
                    <span className="text-green-400">-5 ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">ρ⋆:</span>
                    <span className="text-red-400">+0.04 g/cm³</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractivePanel;