import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { 
  Atom, AlertTriangle, CheckCircle2, Info, TrendingUp,
  Download, Upload, Eye
} from "lucide-react";

const ParametersPanel = ({ data, candidate }) => {
  // Sample parameter data - in real implementation, this would come from props
  const observedParams = {
    depth: 0.027,
    depthError: 0.0006,
    duration: 4.20,
    durationError: 0.15,
    period: 129.9000,
    periodError: 0.0250,
    epoch: 2457000.12345,
    epochError: 0.00012
  };

  const physicsParams = {
    derivedRp: 1.50,
    derivedRpError: 0.08,
    impactParameter: 0.000,
    impactParameterError: 0.045,
    aOverRs: 167.95,
    aOverRsError: 2.34,
    inclination: 89.7,
    inclinationError: 0.3,
    stellarDensity: 1.48,
    stellarDensityError: 0.12,
    equilibriumTemp: 1547,
    equilibriumTempError: 45
  };

  const catalogParams = {
    stellarMass: 1.12,
    stellarMassError: 0.08,
    stellarRadius: 1.05,
    stellarRadiusError: 0.03,
    stellarTemp: 5890,
    stellarTempError: 85,
    distance: 124.7,
    distanceError: 2.1,
    magnitude: 10.245,
    magnitudeError: 0.012
  };

  const consistencyChecks = [
    { 
      parameter: "Duration", 
      status: "FAIL", 
      observed: "4.20 h", 
      expected: "9.19 h", 
      sigma: 23.6,
      severity: "high"
    },
    { 
      parameter: "Stellar Density", 
      status: "WARN", 
      observed: "1.48 g/cm³", 
      expected: "1.52 g/cm³", 
      sigma: 0.3,
      severity: "low"
    },
    { 
      parameter: "Planet Radius", 
      status: "PASS", 
      observed: "1.50 Re", 
      expected: "1.47 Re", 
      sigma: 0.4,
      severity: "none"
    },
    { 
      parameter: "Orbit Period", 
      status: "PASS", 
      observed: "129.900 d", 
      expected: "129.902 d", 
      sigma: 0.1,
      severity: "none"
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'PASS': return 'text-emerald-400';
      case 'WARN': return 'text-yellow-400';
      case 'FAIL': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'PASS': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'FAIL': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Physics Consistency Alert */}
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

      {/* Parameters Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Observed Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="w-4 h-4 text-cyan-400" />
              Observed Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="exoseer-label">Depth:</span>
                <span className="text-white">{observedParams.depth.toFixed(3)}% ± {observedParams.depthError.toFixed(4)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Duration:</span>
                <span className="text-white">{observedParams.duration.toFixed(2)} ± {observedParams.durationError.toFixed(2)} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Period:</span>
                <span className="text-white">{observedParams.period.toFixed(4)} ± {observedParams.periodError.toFixed(4)} days</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Epoch:</span>
                <span className="text-white">{observedParams.epoch.toFixed(5)} ± {observedParams.epochError.toFixed(5)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700">
              <h4 className="font-semibold text-white mb-2 text-sm">Data Quality</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="exoseer-label">Transit SNR:</span>
                  <span className="text-cyan-400 font-bold">28.0</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="exoseer-label">Phase Coverage:</span>
                  <span className="text-cyan-400 font-bold">94%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="exoseer-label">Cadence:</span>
                  <span className="text-cyan-400 font-bold">2-min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Physics-Derived Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Atom className="w-4 h-4 text-blue-400" />
              Physics-Derived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="exoseer-label">Planet Radius:</span>
                <span className="text-cyan-400">{physicsParams.derivedRp.toFixed(2)} ± {physicsParams.derivedRpError.toFixed(2)} Re</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Impact Parameter:</span>
                <span className="text-cyan-400">{physicsParams.impactParameter.toFixed(3)} ± {physicsParams.impactParameterError.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">a/R*:</span>
                <span className="text-cyan-400">{physicsParams.aOverRs.toFixed(2)} ± {physicsParams.aOverRsError.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Inclination:</span>
                <span className="text-cyan-400">{physicsParams.inclination.toFixed(1)} ± {physicsParams.inclinationError.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Stellar ρ:</span>
                <span className="text-cyan-400">{physicsParams.stellarDensity.toFixed(2)} ± {physicsParams.stellarDensityError.toFixed(2)} g/cm³</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Teq:</span>
                <span className="text-cyan-400">{physicsParams.equilibriumTemp} ± {physicsParams.equilibriumTempError} K</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catalog Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Catalog Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="exoseer-label">Stellar Mass:</span>
                <span className="text-white">{catalogParams.stellarMass.toFixed(2)} ± {catalogParams.stellarMassError.toFixed(2)} M☉</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Stellar Radius:</span>
                <span className="text-white">{catalogParams.stellarRadius.toFixed(2)} ± {catalogParams.stellarRadiusError.toFixed(2)} R☉</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Stellar Temp:</span>
                <span className="text-white">{catalogParams.stellarTemp} ± {catalogParams.stellarTempError} K</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">Distance:</span>
                <span className="text-white">{catalogParams.distance.toFixed(1)} ± {catalogParams.distanceError.toFixed(1)} pc</span>
              </div>
              <div className="flex justify-between">
                <span className="exoseer-label">TESS Mag:</span>
                <span className="text-white">{catalogParams.magnitude.toFixed(3)} ± {catalogParams.magnitudeError.toFixed(3)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700">
              <h4 className="font-semibold text-white mb-2 text-sm">Source</h4>
              <div className="space-y-1 text-xs">
                <div className="exoseer-label">TIC 441420236</div>
                <div className="exoseer-label">Gaia DR3</div>
                <div className="exoseer-label">2MASS</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consistency Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Physics Consistency Checks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {consistencyChecks.map((check, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  check.status === 'PASS' ? 'bg-emerald-900/20 border-emerald-500/30' :
                  check.status === 'WARN' ? 'bg-yellow-900/20 border-yellow-500/30' :
                  'bg-red-900/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(check.status)}
                    <span className="font-medium text-white">{check.parameter}</span>
                  </div>
                  <Badge className={`${
                    check.status === 'PASS' ? 'exoseer-badge exoseer-badge-confirmed' :
                    check.status === 'WARN' ? 'exoseer-badge exoseer-badge-candidate' :
                    'exoseer-badge bg-red-600'
                  }`}>
                    {check.status}
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="exoseer-label">Observed:</span>
                    <span className={getStatusColor(check.status)}>{check.observed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">Expected:</span>
                    <span className="text-gray-400">{check.expected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="exoseer-label">Discrepancy:</span>
                    <span className={getStatusColor(check.status)}>{check.sigma.toFixed(1)}σ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Statistics */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-400">2</div>
                <div className="exoseer-label">Passed Checks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">1</div>
                <div className="exoseer-label">Warnings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">1</div>
                <div className="exoseer-label">Failed Checks</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Controls */}
      <Card className="border-gray-600">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white mb-1">Parameter Export</h4>
              <p className="text-xs exoseer-subtitle">Export parameter comparison and consistency analysis</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="exoseer_outline" 
                size="sm"
                onClick={() => exportParameters('csv')}
              >
                <Download className="w-3 h-3 mr-2" />
                CSV
              </Button>
              <Button 
                variant="exoseer_outline" 
                size="sm"
                onClick={() => exportParameters('json')}
              >
                <Download className="w-3 h-3 mr-2" />
                JSON
              </Button>
              <Button 
                variant="exoseer_outline" 
                size="sm"
                onClick={() => exportParameters('report')}
              >
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

export default ParametersPanel;