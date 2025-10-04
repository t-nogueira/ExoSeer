import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { formatNumber, formatPeriod, formatDepth, formatDuration } from '../lib/utils';
import LightCurveChart from './LightCurveChart';

const TransitAnalysisPanel = ({ analysis }) => {
  if (!analysis) return null;
  
  return (
    <Card className="border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Physics-Informed Transit Analysis
          <Badge variant={analysis.confidence_score > 0.7 ? 'confirmed' : 'candidate'}>
            {Math.round((analysis.confidence_score || 0) * 100)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-blue-400" data-testid="transit-period">
              {formatNumber(analysis.period)}
            </div>
            <div className="text-xs text-gray-400">Period (days)</div>
            {analysis.period_uncertainty && (
              <div className="text-xs text-gray-500">
                ±{formatNumber(analysis.period_uncertainty)}
              </div>
            )}
          </div>
          
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-green-400" data-testid="transit-depth">
              {formatNumber(analysis.depth * 1e6, 0)}
            </div>
            <div className="text-xs text-gray-400">Depth (ppm)</div>
            {analysis.depth_uncertainty && (
              <div className="text-xs text-gray-500">
                ±{formatNumber(analysis.depth_uncertainty * 1e6, 0)}
              </div>
            )}
          </div>
          
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-purple-400" data-testid="transit-duration">
              {formatNumber(analysis.duration)}
            </div>
            <div className="text-xs text-gray-400">Duration (hrs)</div>
            {analysis.duration_uncertainty && (
              <div className="text-xs text-gray-500">
                ±{formatNumber(analysis.duration_uncertainty)}
              </div>
            )}
          </div>
          
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-yellow-400" data-testid="transit-snr">
              {formatNumber(analysis.snr)}
            </div>
            <div className="text-xs text-gray-400">SNR</div>
          </div>
        </div>
        
        {analysis.fitted_parameters && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Model Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(analysis.fitted_parameters).map(([key, value]) => (
                <div key={key} className="flex justify-between p-2 rounded bg-gray-800/30">
                  <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="text-white">{formatNumber(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CentroidAnalysisPanel = ({ analysis }) => {
  if (!analysis) return null;
  
  return (
    <Card className="border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg">Centroid Motion Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-blue-400" data-testid="centroid-offset">
              {formatNumber(analysis.offset_mas)}
            </div>
            <div className="text-xs text-gray-400">Offset (mas)</div>
            {analysis.offset_uncertainty && (
              <div className="text-xs text-gray-500">
                ±{formatNumber(analysis.offset_uncertainty)}
              </div>
            )}
          </div>
          
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-green-400" data-testid="centroid-snr">
              {formatNumber(analysis.snr_ratio)}
            </div>
            <div className="text-xs text-gray-400">S/N Ratio</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-purple-400" data-testid="motion-correlation">
              {formatNumber(analysis.motion_correlation, 3)}
            </div>
            <div className="text-xs text-gray-400">Motion Corr.</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-gray-800/50">
            <div className="text-2xl font-bold text-yellow-400" data-testid="centroid-significance">
              {formatNumber(analysis.centroid_shift_significance)}σ
            </div>
            <div className="text-xs text-gray-400">Significance</div>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">What This Means</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
              <div>Real planets cause minimal centroid shift during transits</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
              <div>Background contamination appears manageable for this detection</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
              <div>Motion correlation with transit is a good validation indicator</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0"></div>
              <div>Analysis follows standard exoplanet validation procedures</div>
            </div>
          </div>
        </div>
        
        {analysis.validation_flags && analysis.validation_flags.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Validation Flags</h4>
            <div className="space-y-1">
              {analysis.validation_flags.map((flag, index) => (
                <div key={index} className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-300">
                  {flag}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const UncertaintyPanel = ({ analysis }) => {
  if (!analysis) return null;
  
  return (
    <Card className="border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Uncertainty Quantification
          <Badge variant={analysis.validation_score > 0.7 ? 'confirmed' : 'candidate'}>
            Score: {formatNumber(analysis.validation_score)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis.parameter_uncertainties && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Parameter Uncertainties</h4>
            <div className="space-y-2">
              {Object.entries(analysis.parameter_uncertainties).map(([param, uncertainty]) => (
                <div key={param} className="flex justify-between items-center">
                  <span className="text-gray-400 capitalize text-sm">{param.replace('_', ' ')}</span>
                  <span className="text-white text-sm">±{formatNumber(uncertainty)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {analysis.confidence_intervals && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Confidence Intervals</h4>
            <div className="space-y-2">
              {Object.entries(analysis.confidence_intervals).map(([param, interval]) => (
                <div key={param} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{param.replace('_', ' ')}</span>
                    <span className="text-white">
                      [{formatNumber(interval.min)} - {formatNumber(interval.max)}]
                    </span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {analysis.reliability_flags && analysis.reliability_flags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Reliability Assessment</h4>
            <div className="space-y-2">
              {analysis.reliability_flags.map((flag, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    flag.toLowerCase().includes('low') || flag.toLowerCase().includes('error') 
                      ? 'bg-red-500' 
                      : flag.toLowerCase().includes('high') || flag.toLowerCase().includes('significant')
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}></div>
                  <span className="text-gray-300">{flag}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EnsemblePredictionsPanel = ({ analysis }) => {
  if (!analysis) return null;
  
  const planetProbability = Math.round((analysis.planet_probability || 0) * 100);
  const fpProbability = Math.round((analysis.false_positive_probability || 0) * 100);
  
  return (
    <Card className="border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg">Ensemble Predictions & Decision Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gray-800/50">
            <div className="text-3xl font-bold text-green-400 mb-1" data-testid="planet-probability">
              {planetProbability}%
            </div>
            <div className="text-xs text-gray-400">Planet Probability</div>
            <Progress value={planetProbability} className="mt-2 h-2" />
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gray-800/50">
            <div className="text-3xl font-bold text-red-400 mb-1" data-testid="false-positive-probability">
              {fpProbability}%
            </div>
            <div className="text-xs text-gray-400">False Positive Risk</div>
            <Progress value={fpProbability} className="mt-2 h-2" />
          </div>
          
          <div className="text-center p-4 rounded-lg bg-gray-800/50">
            <div className="text-xl font-bold text-blue-400 mb-1 capitalize" data-testid="confidence-level">
              {analysis.confidence_level || 'Medium'}
            </div>
            <div className="text-xs text-gray-400">Confidence Level</div>
            <Badge 
              variant={analysis.decision_recommendation === 'confirm' ? 'confirmed' : 'candidate'}
              className="mt-2"
              data-testid="decision-recommendation"
            >
              {analysis.decision_recommendation || 'Review'}
            </Badge>
          </div>
        </div>
        
        {analysis.key_evidence && analysis.key_evidence.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Supporting Evidence</h4>
            <div className="space-y-2">
              {analysis.key_evidence.map((evidence, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-300">{evidence}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {analysis.concerns && analysis.concerns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Areas of Concern</h4>
            <div className="space-y-2">
              {analysis.concerns.map((concern, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-300">{concern}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {analysis.follow_up_recommendations && analysis.follow_up_recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Follow-up Recommendations</h4>
            <div className="space-y-2">
              {analysis.follow_up_recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnalysisPanel = ({ 
  analysisResult, 
  isAnalyzing = false,
  onExportPDF,
  onExportCSV 
}) => {
  const [activeTab, setActiveTab] = useState("light_curve");
  
  if (isAnalyzing) {
    return (
      <Card className="border-gray-700" data-testid="analysis-loading">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-white font-medium mb-2">Running Analysis...</div>
            <div className="text-gray-400 text-sm">This may take a few moments</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!analysisResult) {
    return (
      <Card className="border-gray-700" data-testid="no-analysis">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400 mb-2">No Analysis Available</div>
          <div className="text-xs text-gray-500">
            Select a candidate and run analysis to see results
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { analyses = {} } = analysisResult;
  
  return (
    <div className="space-y-4" data-testid="analysis-panel">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="light_curve" data-testid="tab-light-curve">Light Curve</TabsTrigger>
          <TabsTrigger value="transit" data-testid="tab-transit">Physics</TabsTrigger>
          <TabsTrigger value="centroid" data-testid="tab-centroid">Centroid</TabsTrigger>
          <TabsTrigger value="uncertainty" data-testid="tab-uncertainty">Uncertainty</TabsTrigger>
        </TabsList>
        
        <TabsContent value="light_curve">
          {analyses.light_curve ? (
            <LightCurveChart data={analyses.light_curve} />
          ) : (
            <Card className="border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="text-gray-400">No light curve data available</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="transit">
          <TransitAnalysisPanel analysis={analyses.transit_analysis} />
        </TabsContent>
        
        <TabsContent value="centroid">
          <CentroidAnalysisPanel analysis={analyses.centroid_analysis} />
        </TabsContent>
        
        <TabsContent value="uncertainty">
          <div className="space-y-4">
            <UncertaintyPanel analysis={analyses.uncertainty_analysis} />
            <EnsemblePredictionsPanel analysis={analyses.ensemble_predictions} />
          </div>
        </TabsContent>
      </Tabs>
      
      {analysisResult && (
        <div className="flex gap-2 pt-4 border-t border-gray-700">
          <Button 
            variant="exoseer_outline" 
            size="sm"
            onClick={() => onExportPDF && onExportPDF(analysisResult.analysis_id)}
            data-testid="export-pdf-button"
          >
            Generate Report (PDF)
          </Button>
          <Button 
            variant="exoseer_outline" 
            size="sm"
            onClick={() => onExportCSV && onExportCSV(analysisResult.analysis_id)}
            data-testid="export-csv-button"
          >
            Export Data (CSV)
          </Button>
          <Button 
            variant="exoseer_outline" 
            size="sm"
            data-testid="share-analysis-button"
          >
            Share Analysis
          </Button>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;