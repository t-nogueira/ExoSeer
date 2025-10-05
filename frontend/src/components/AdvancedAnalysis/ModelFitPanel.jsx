import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  BarChart3, TrendingUp, Zap, AlertTriangle, CheckCircle2,
  Eye, Download, Settings, Activity, RefreshCw
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  Tooltip, ReferenceLine, ScatterChart, Scatter, Bar, BarChart
} from 'recharts';

const ModelFitPanel = ({ data, candidate }) => {
  const [activeModelTab, setActiveModelTab] = useState('transit');
  const [showResiduals, setShowResiduals] = useState(true);
  const [fitInProgress, setFitInProgress] = useState(false);

  // Sample model fit data
  const transitFitData = Array.from({ length: 100 }, (_, i) => {
    const phase = (i - 50) / 50 * 0.1; // -0.1 to 0.1 phase
    const depth = 0.00027;
    const width = 0.02;
    
    // Transit model (simplified)
    const transitShape = Math.abs(phase) < width ? 
      depth * (1 - Math.pow(phase / width, 2)) : 0;
    
    const modelFlux = 1 - transitShape;
    const observedFlux = modelFlux + (Math.random() - 0.5) * 0.0002; // Add noise
    const residual = observedFlux - modelFlux;
    
    return {
      phase: phase,
      observed: observedFlux,
      model: modelFlux,
      residual: residual
    };
  });

  const fitStatistics = {
    chi2: 127.8,
    dof: 95,
    chi2Reduced: 1.35,
    rmse: 0.000145,
    bic: -892.4,
    aic: -895.1,
    logLikelihood: 450.05,
    iterations: 23,
    convergence: 'SUCCESS'
  };

  const parameterCorrelations = [
    { param1: 'Period', param2: 'T0', correlation: 0.02 },
    { param1: 'Period', param2: 'Rp/Rs', correlation: -0.15 },
    { param1: 'Period', param2: 'Impact', correlation: 0.08 },
    { param1: 'Rp/Rs', param2: 'Impact', correlation: -0.42 },
    { param1: 'Rp/Rs', param2: 'Limb Dark', correlation: 0.31 },
    { param1: 'Impact', param2: 'a/Rs', correlation: 0.67 }
  ];

  const residualDiagnostics = {
    autocorrelation: {
      lag1: 0.03,
      lag2: -0.01,
      lag3: 0.02,
      significance: 'PASS'
    },
    normalityTest: {
      shapiroWilk: 0.987,
      pValue: 0.23,
      significance: 'PASS'
    },
    runTest: {
      statistic: -0.45,
      pValue: 0.65,
      significance: 'PASS'
    }
  };

  const handleRefit = () => {
    setFitInProgress(true);
    setTimeout(() => {
      setFitInProgress(false);
    }, 3000);
  };

  const formatNumber = (num, decimals = 3) => {
    if (Math.abs(num) < 0.001) {
      return num.toExponential(2);
    }
    return num.toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      {/* Fit Status and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Model Fit Results
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={`exoseer-badge ${fitStatistics.convergence === 'SUCCESS' ? 
                'exoseer-badge-confirmed' : 'bg-red-600'}`}>
                {fitStatistics.convergence}
              </Badge>
              <Button
                variant="exoseer_outline"
                size="sm"
                onClick={handleRefit}
                disabled={fitInProgress}
              >
                {fitInProgress ? (
                  <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full mr-2" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-2" />
                )}
                Refit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-cyan-400">{fitStatistics.chi2Reduced.toFixed(2)}</div>
              <div className="exoseer-label">χ²/DoF</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-blue-400">{(fitStatistics.rmse * 1e6).toFixed(0)}</div>
              <div className="exoseer-label">RMSE (ppm)</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-purple-400">{fitStatistics.bic.toFixed(1)}</div>
              <div className="exoseer-label">BIC</div>
            </div>
            <div className="exoseer-metric-card">
              <div className="text-lg font-bold text-emerald-400">{fitStatistics.iterations}</div>
              <div className="exoseer-label">Iterations</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Fit Quality Assessment</span>
            </div>
            <p className="text-sm text-emerald-200">
              Excellent fit quality (χ²/DoF = {fitStatistics.chi2Reduced.toFixed(2)}). 
              Model converged in {fitStatistics.iterations} iterations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Model Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Model Visualization
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showResiduals}
                onChange={(e) => setShowResiduals(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm exoseer-subtitle">Show Residuals</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeModelTab} onValueChange={setActiveModelTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="transit" className="exoseer-tab">Transit Fit</TabsTrigger>
              <TabsTrigger value="residuals" className="exoseer-tab">Residuals</TabsTrigger>
              <TabsTrigger value="diagnostics" className="exoseer-tab">Diagnostics</TabsTrigger>
            </TabsList>

            {/* Transit Fit */}
            <TabsContent value="transit">
              <div className="space-y-4">
                <div className="exoseer-chart-container">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={transitFitData}>
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
                          domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                          tickFormatter={(value) => ((1 - value) * 1e6).toFixed(0) + ' ppm'}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                            border: '1px solid #00d4ff',
                            borderRadius: '6px'
                          }}
                          formatter={(value, name) => [
                            `${((1 - value) * 1e6).toFixed(0)} ppm`,
                            name === 'observed' ? 'Observed' : 'Model'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="observed" 
                          stroke="#00d4ff" 
                          strokeWidth={1}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="model" 
                          stroke="#ff6b6b" 
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="3 3"
                        />
                        <ReferenceLine y={1} stroke="#666" strokeWidth={1} strokeDasharray="2 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Model Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Best-fit Parameters</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="exoseer-label">Period:</span>
                        <span className="text-cyan-400">129.90001 ± 0.00012 days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Rp/Rs:</span>
                        <span className="text-cyan-400">0.05147 ± 0.00023</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Impact:</span>
                        <span className="text-cyan-400">0.203 ± 0.045</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">a/Rs:</span>
                        <span className="text-cyan-400">167.95 ± 2.34</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">T0:</span>
                        <span className="text-cyan-400">2457000.12345 ± 0.00008</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Limb Darkening</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="exoseer-label">Law:</span>
                        <span className="text-white">Quadratic</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">u1:</span>
                        <span className="text-cyan-400">0.312 ± 0.045</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">u2:</span>
                        <span className="text-cyan-400">0.218 ± 0.038</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Source:</span>
                        <span className="text-white">Claret (2017)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Residuals Analysis */}
            <TabsContent value="residuals">
              <div className="space-y-4">
                <div className="exoseer-chart-container">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={transitFitData}>
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
                        <ReferenceLine y={0.0002} stroke="#666" strokeWidth={1} strokeOpacity={0.3} />
                        <ReferenceLine y={-0.0002} stroke="#666" strokeWidth={1} strokeOpacity={0.3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Autocorrelation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="exoseer-label">Lag 1:</span>
                        <span className="text-cyan-400">{residualDiagnostics.autocorrelation.lag1.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Lag 2:</span>
                        <span className="text-cyan-400">{residualDiagnostics.autocorrelation.lag2.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Test:</span>
                        <span className={`font-bold ${residualDiagnostics.autocorrelation.significance === 'PASS' ? 
                          'text-emerald-400' : 'text-red-400'}`}>
                          {residualDiagnostics.autocorrelation.significance}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Normality</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="exoseer-label">Shapiro-Wilk:</span>
                        <span className="text-cyan-400">{residualDiagnostics.normalityTest.shapiroWilk.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">p-value:</span>
                        <span className="text-cyan-400">{residualDiagnostics.normalityTest.pValue.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Test:</span>
                        <span className={`font-bold ${residualDiagnostics.normalityTest.significance === 'PASS' ? 
                          'text-emerald-400' : 'text-red-400'}`}>
                          {residualDiagnostics.normalityTest.significance}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Randomness</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="exoseer-label">Run Test:</span>
                        <span className="text-cyan-400">{residualDiagnostics.runTest.statistic.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">p-value:</span>
                        <span className="text-cyan-400">{residualDiagnostics.runTest.pValue.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Test:</span>
                        <span className={`font-bold ${residualDiagnostics.runTest.significance === 'PASS' ? 
                          'text-emerald-400' : 'text-red-400'}`}>
                          {residualDiagnostics.runTest.significance}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Diagnostics */}
            <TabsContent value="diagnostics">
              <div className="space-y-6">
                {/* Parameter Correlations */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Parameter Correlations</h4>
                  <div className="space-y-2">
                    {parameterCorrelations.map((corr, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-24 text-sm exoseer-label">{corr.param1}</div>
                        <div className="w-2 text-center text-gray-400">×</div>
                        <div className="w-24 text-sm exoseer-label">{corr.param2}</div>
                        <div className="flex-1 mx-4">
                          <Progress 
                            value={Math.abs(corr.correlation) * 100} 
                            className="h-2"
                          />
                        </div>
                        <div className={`w-16 text-sm font-bold ${
                          Math.abs(corr.correlation) > 0.5 ? 'text-red-400' :
                          Math.abs(corr.correlation) > 0.3 ? 'text-yellow-400' :
                          'text-emerald-400'
                        }`}>
                          {corr.correlation.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fit Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Information Criteria</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="exoseer-label">AIC:</span>
                        <span className="text-cyan-400">{fitStatistics.aic.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">BIC:</span>
                        <span className="text-cyan-400">{fitStatistics.bic.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Log-Likelihood:</span>
                        <span className="text-cyan-400">{fitStatistics.logLikelihood.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Convergence Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="exoseer-label">Status:</span>
                        <span className={`font-bold ${fitStatistics.convergence === 'SUCCESS' ? 
                          'text-emerald-400' : 'text-red-400'}`}>
                          {fitStatistics.convergence}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Iterations:</span>
                        <span className="text-cyan-400">{fitStatistics.iterations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="exoseer-label">Method:</span>
                        <span className="text-white">Levenberg-Marquardt</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export and Actions */}
      <Card className="border-gray-600">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white mb-1">Model Export</h4>
              <p className="text-xs exoseer-subtitle">Export fit results, parameters, and diagnostics</p>
            </div>
            <div className="flex gap-2">
              <Button variant="exoseer_outline" size="sm">
                <Download className="w-3 h-3 mr-2" />
                Parameters
              </Button>
              <Button variant="exoseer_outline" size="sm">
                <Download className="w-3 h-3 mr-2" />
                Residuals
              </Button>
              <Button variant="exoseer_outline" size="sm">
                <Download className="w-3 h-3 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelFitPanel;