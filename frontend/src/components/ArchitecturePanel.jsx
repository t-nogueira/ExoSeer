import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { 
  Cpu, Eye, Target, Atom, BarChart3, Brain, Settings,
  TrendingUp, Zap, Network, Activity
} from "lucide-react";

const ArchitecturePanel = () => {
  const architectureData = {
    branches: [
      {
        id: 'light-curve',
        name: 'Light Curve Branch',
        description: '1D-CNN + Transformer for transit detection',
        performance: 94.2,
        icon: Activity,
        color: 'text-cyan-400',
        features: [
          'GP detrending',
          'Transit shapes', 
          'Stellar variability robust'
        ]
      },
      {
        id: 'pixel-centroid',
        name: 'Pixel/Centroid Branch',
        description: '2D-CNN for contamination detection',
        performance: 89.7,
        icon: Eye,
        color: 'text-purple-400',
        features: [
          'Difference images',
          'Centroid shifts',
          'Background EBs'
        ]
      },
      {
        id: 'system-context',
        name: 'System Context Branch', 
        description: 'MLP for stellar parameters',
        performance: 91.5,
        icon: Target,
        color: 'text-yellow-400',
        features: [
          'Stellar radius/Teff',
          'RUWE/Gaia',
          'Contamination metrics'
        ]
      },
      {
        id: 'physics-prior',
        name: 'Physics Prior',
        description: 'Differentiable transit model',
        performance: 96.8,
        icon: Atom,
        color: 'text-green-400',
        features: [
          'Period/duration/depth',
          'BLS comparison',
          'Physical constraints'
        ]
      }
    ],
    fusion: {
      weights: {
        lightCurve: 0.45,
        pixels: 0.25,
        context: 0.15,
        physics: 0.15
      }
    },
    performance: {
      ensembleAccuracy: 93.7,
      precisionAt90Recall: 87.2,
      domainTransferScore: 84.6,
      uncertaintyCalibration: 92.1,
      rocAuc: 0.947
    },
    domainAdaptation: [
      {
        name: 'Feature Extractor',
        description: 'Mission-agnostic representations',
        icon: Brain,
        color: 'text-blue-400'
      },
      {
        name: 'Domain Discriminator',
        description: 'Adversarial mission detection',
        icon: Target,
        color: 'text-red-400'
      },
      {
        name: 'Classifier',
        description: 'Planet vs. false positive',
        icon: Zap,
        color: 'text-emerald-400'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Architecture Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            Multimodal Architecture
          </CardTitle>
          <p className="exoseer-subtitle">Physics-guided fusion of multiple evidence streams</p>
        </CardHeader>
      </Card>

      {/* Architecture Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {architectureData.branches.map((branch) => {
          const IconComponent = branch.icon;
          return (
            <Card key={branch.id} className="border-gray-700">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 ${branch.color}`} />
                    <div>
                      <h3 className="font-semibold text-white">{branch.name}</h3>
                      <p className="text-xs exoseer-subtitle">{branch.description}</p>
                    </div>
                  </div>
                  <Badge className={`exoseer-badge ${branch.performance > 94 ? 'exoseer-badge-confirmed' : 'exoseer-badge-candidate'}`}>
                    {branch.performance}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {branch.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <span className="text-sm exoseer-subtitle">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fusion Layer */}
      <Card className="border-cyan-400/30 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Fusion Layer
          </CardTitle>
          <p className="text-sm exoseer-subtitle">Late fusion with attention mechanism</p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-900/20 border border-cyan-400/30">
                <Brain className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-white">Attention-weighted fusion</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-cyan-400/20">
              <div className="text-center">
                <div className="text-lg font-bold text-white">0.45</div>
                <div className="text-xs exoseer-label">Light Curve</div>
                <div className="text-xs text-cyan-400">Weight</div>
              </div>
            </div>
            <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-400/20">
              <div className="text-center">
                <div className="text-lg font-bold text-white">0.25</div>
                <div className="text-xs exoseer-label">Pixels</div>
                <div className="text-xs text-purple-400">Weight</div>
              </div>
            </div>
            <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-400/20">
              <div className="text-center">
                <div className="text-lg font-bold text-white">0.15</div>
                <div className="text-xs exoseer-label">Context</div>
                <div className="text-xs text-yellow-400">Weight</div>
              </div>
            </div>
            <div className="bg-green-900/20 p-3 rounded-lg border border-green-400/20">
              <div className="text-center">
                <div className="text-lg font-bold text-white">0.15</div>
                <div className="text-xs exoseer-label">Physics</div>
                <div className="text-xs text-green-400">Weight</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Performance Metrics
          </CardTitle>
          <p className="text-sm exoseer-subtitle">Cross-mission validation results</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold text-cyan-400 mb-2">
                {architectureData.performance.ensembleAccuracy}%
              </div>
              <div className="exoseer-label mb-2">Ensemble Accuracy</div>
              <Progress value={architectureData.performance.ensembleAccuracy} className="h-2" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {architectureData.performance.precisionAt90Recall}%
              </div>
              <div className="exoseer-label mb-2">Precision @ 90% Recall</div>
              <Progress value={architectureData.performance.precisionAt90Recall} className="h-2" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 mb-2">
                {architectureData.performance.domainTransferScore}%
              </div>
              <div className="exoseer-label mb-2">Domain Transfer Score</div>
              <Progress value={architectureData.performance.domainTransferScore} className="h-2" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400 mb-2">
                {architectureData.performance.uncertaintyCalibration}%
              </div>
              <div className="exoseer-label mb-2">Uncertainty Calibration</div>
              <Progress value={architectureData.performance.uncertaintyCalibration} className="h-2" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
              <div className="text-3xl font-bold text-emerald-400">ROC-AUC: {architectureData.performance.rocAuc}</div>
              <div className="text-sm exoseer-subtitle ml-2">Kepler validation set</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain Adaptation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Domain Adaptation
          </CardTitle>
          <p className="text-sm exoseer-subtitle">Adversarial training for mission-invariant representations</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {architectureData.domainAdaptation.map((component, idx) => {
              const IconComponent = component.icon;
              return (
                <div key={idx} className="text-center p-4 rounded-lg bg-slate-800/50 border border-gray-600">
                  <div className="mb-3">
                    <IconComponent className={`w-8 h-8 ${component.color} mx-auto`} />
                  </div>
                  <h4 className="font-semibold text-white mb-2">{component.name}</h4>
                  <p className="text-xs exoseer-subtitle">{component.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchitecturePanel;