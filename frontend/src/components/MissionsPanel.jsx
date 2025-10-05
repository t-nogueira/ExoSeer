import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Satellite, Telescope, Database, MapPin, Calendar,
  Target, CheckCircle2, Eye, TrendingUp, Search
} from "lucide-react";

const MissionsPanel = ({ onMissionSearch }) => {
  const [showArchitectureDetails, setShowArchitectureDetails] = useState(false);
  const missionsData = [
    {
      id: 'kepler',
      name: 'Kepler',
      status: 'Complete',
      description: 'Original exoplanet hunter (2009-2013)',
      period: '2009-2013',
      icon: Telescope,
      iconColor: 'text-blue-400',
      statusColor: 'exoseer-badge',
      targets: '200K+',
      candidates: '4,496',
      confirmed: '2,662',
      details: {
        fieldOfView: '105 square degrees',
        photometricPrecision: '20 ppm',
        cadence: '29.4 minutes',
        primaryMission: 'Find Earth-sized planets in habitable zone'
      }
    },
    {
      id: 'k2',
      name: 'K2',
      status: 'Complete', 
      description: 'Extended Kepler mission (2014-2018)',
      period: '2014-2018',
      icon: Satellite,
      iconColor: 'text-yellow-400',
      statusColor: 'exoseer-badge',
      targets: '300K+',
      candidates: '1,617',
      confirmed: '479',
      details: {
        fieldOfView: 'Multiple campaign fields',
        photometricPrecision: '30 ppm',
        cadence: '29.4 minutes',
        primaryMission: 'Extended survey of diverse stellar populations'
      }
    },
    {
      id: 'tess',
      name: 'TESS',
      status: 'Active',
      description: 'Current all-sky survey (2018-present)',
      period: '2018-present',
      icon: Database,
      iconColor: 'text-emerald-400',
      statusColor: 'exoseer-badge exoseer-badge-confirmed',
      targets: '200M+',
      candidates: '7,000+',
      confirmed: '1,000+',
      details: {
        fieldOfView: 'Full sky coverage',
        photometricPrecision: '60 ppm',
        cadence: '2 minutes / 30 minutes',
        primaryMission: 'All-sky transit survey for nearby bright stars'
      }
    }
  ];

  const domainAdaptationStatus = {
    status: 'Mission-invariant embeddings enable cross-platform analysis',
    completeness: 94.2,
    capabilities: [
      'Seamless cross-mission data fusion',
      'Unified feature representations',
      'Transfer learning optimization',
      'Multi-mission validation protocols'
    ]
  };

  const handleMissionSearch = (missionId) => {
    if (onMissionSearch) {
      const missionNames = {
        'kepler': 'Kepler',
        'k2': 'K2', 
        'tess': 'TESS'
      };
      onMissionSearch(missionNames[missionId] || missionId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mission Coverage Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="w-6 h-6 text-cyan-400" />
            Mission Coverage
          </CardTitle>
          <p className="exoseer-subtitle">ExoSeer operates across multiple space missions with domain adaptation</p>
        </CardHeader>
      </Card>

      {/* Mission Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {missionsData.map((mission) => {
          const IconComponent = mission.icon;
          return (
            <Card key={mission.id} className="border-gray-700 hover:border-cyan-400/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-6 h-6 ${mission.iconColor}`} />
                    <h3 className="text-xl font-bold text-white">{mission.name}</h3>
                  </div>
                  <Badge className={mission.statusColor}>
                    {mission.status}
                  </Badge>
                </div>
                <p className="text-sm exoseer-subtitle">{mission.description}</p>
              </CardHeader>
              
              <CardContent>
                {/* Mission Statistics */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="exoseer-label">Targets:</span>
                    <span className="text-white font-bold">{mission.targets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="exoseer-label">Candidates:</span>
                    <span className="text-cyan-400 font-bold">{mission.candidates.toLocaleString ? mission.candidates.toLocaleString() : mission.candidates}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="exoseer-label">Confirmed:</span>
                    <span className="text-emerald-400 font-bold">{mission.confirmed.toLocaleString ? mission.confirmed.toLocaleString() : mission.confirmed}</span>
                  </div>
                </div>

                {/* Mission Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3 h-3 text-gray-400" />
                    <span className="exoseer-label">FOV:</span>
                    <span className="text-gray-300">{mission.details.fieldOfView}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-gray-400" />
                    <span className="exoseer-label">Precision:</span>
                    <span className="text-gray-300">{mission.details.photometricPrecision}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="exoseer-label">Cadence:</span>
                    <span className="text-gray-300">{mission.details.cadence}</span>
                  </div>
                </div>

                {/* Mission Objective */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-gray-600">
                  <p className="text-xs text-gray-300">{mission.details.primaryMission}</p>
                </div>
                
                {/* Quick Search Button */}
                <div className="mt-4">
                  <Button 
                    variant="exoseer" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleMissionSearch(mission.id)}
                  >
                    <Search className="w-3 h-3 mr-2" />
                    Search All {mission.name} Discoveries
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Domain Adaptation Status */}
      <Card className="border-cyan-400/30 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Domain Adaptation Status
              </CardTitle>
              <p className="text-sm exoseer-subtitle mt-1">{domainAdaptationStatus.status}</p>
            </div>
            <Button 
              variant="exoseer_outline" 
              className="ml-4"
              onClick={() => setShowArchitectureDetails(!showArchitectureDetails)}
            >
              View Architecture
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Cross-Mission Capabilities</h4>
              <div className="space-y-2">
                {domainAdaptationStatus.capabilities.map((capability, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm exoseer-subtitle">{capability}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Adaptation Completeness</h4>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">
                  {domainAdaptationStatus.completeness}%
                </div>
                <div className="exoseer-label mb-3">Mission Integration</div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${domainAdaptationStatus.completeness}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Architecture Details */}
      {showArchitectureDetails && (
        <Card className="border-cyan-500/30 bg-cyan-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <Eye className="w-5 h-5" />
              System Architecture Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Neural Network Architecture */}
              <div>
                <h4 className="font-semibold text-white mb-3">Multi-Modal Neural Network</h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-medium text-blue-300">Light Curve Branch</span>
                    </div>
                    <p className="text-xs text-gray-300">CNN + LSTM for temporal pattern recognition</p>
                    <div className="mt-2">
                      <div className="text-sm text-blue-400">94.2% accuracy</div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                      <span className="text-sm font-medium text-purple-300">Centroid Branch</span>
                    </div>
                    <p className="text-xs text-gray-300">Spatial analysis for false positive detection</p>
                    <div className="mt-2">
                      <div className="text-sm text-purple-400">86.7% precision</div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      <span className="text-sm font-medium text-emerald-300">Physics Prior</span>
                    </div>
                    <p className="text-xs text-gray-300">Domain knowledge integration layer</p>
                    <div className="mt-2">
                      <div className="text-sm text-emerald-400">95.4% reliability</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Data */}
              <div>
                <h4 className="font-semibold text-white mb-3">Training Dataset Composition</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">187K</div>
                    <div className="text-xs text-gray-400">Kepler Targets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">34K</div>
                    <div className="text-xs text-gray-400">K2 Targets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">200K+</div>
                    <div className="text-xs text-gray-400">TESS Targets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">12K</div>
                    <div className="text-xs text-gray-400">Confirmed Planets</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                <h4 className="font-semibold text-white mb-3">Model Performance</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Detection Sensitivity</span>
                      <span className="text-sm text-cyan-400">99.1%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '99.1%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">False Positive Rate</span>
                      <span className="text-sm text-red-400">0.3%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '0.3%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mission Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Mission Timeline & Evolution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-yellow-400 to-emerald-400"></div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center">
                  <Telescope className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">Kepler Era</span>
                    <Badge className="exoseer-badge">2009-2013</Badge>
                  </div>
                  <p className="text-sm exoseer-subtitle">Pioneered precision photometry for exoplanet detection</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                  <Satellite className="w-4 h-4 text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">K2 Extension</span>
                    <Badge className="exoseer-badge">2014-2018</Badge>
                  </div>
                  <p className="text-sm exoseer-subtitle">Extended capabilities across diverse stellar fields</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center">
                  <Database className="w-4 h-4 text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">TESS All-Sky</span>
                    <Badge className="exoseer-badge exoseer-badge-confirmed">2018-Present</Badge>
                  </div>
                  <p className="text-sm exoseer-subtitle">Revolutionary full-sky coverage with high-cadence observations</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MissionsPanel;