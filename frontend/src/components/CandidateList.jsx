import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  formatPeriod, 
  formatRadius, 
  formatDepth, 
  formatDuration,
  getStatusBadgeVariant 
} from '../lib/utils';

const CandidateCard = ({ candidate, isSelected, onSelect, onAnalyze }) => {
  const confidence = candidate.confidence_score || 0.5;
  const confidencePercent = Math.round(confidence * 100);
  
  return (
    <Card 
      className={`mb-3 cursor-pointer transition-all duration-200 hover:border-blue-500/50 ${
        isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
      }`}
      onClick={() => onSelect(candidate)}
      data-testid={`candidate-card-${candidate.name}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm mb-1" data-testid="candidate-name">
              {candidate.name || 'Unknown'}
            </h3>
            <p className="text-xs text-gray-400 mb-2" data-testid="candidate-host">
              {candidate.host_star || 'Unknown Host'}
            </p>
            {candidate.discovery_method && (
              <p className="text-xs text-gray-500" data-testid="candidate-method">
                {candidate.discovery_method}
              </p>
            )}
          </div>
          <Badge 
            variant={candidate.status === 'confirmed' ? 'confirmed' : 'candidate'}
            data-testid="candidate-status-badge"
          >
            {candidate.status === 'confirmed' ? 'Confirmed' : 'Candidate'}
          </Badge>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Confidence</span>
            <span className="text-white font-medium" data-testid="confidence-percentage">
              {confidencePercent}%
            </span>
          </div>
          <Progress value={confidencePercent} className="h-2" data-testid="confidence-progress" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-gray-400">Period:</span>
            <div className="text-white" data-testid="candidate-period">
              {formatPeriod(candidate.orbital_period)}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Radius:</span>
            <div className="text-white" data-testid="candidate-radius">
              {formatRadius(candidate.radius_earth)}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Depth:</span>
            <div className="text-white" data-testid="candidate-depth">
              {formatDepth(candidate.transit_depth)}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>
            <div className="text-white" data-testid="candidate-duration">
              {formatDuration(candidate.duration)}
            </div>
          </div>
        </div>
        
        <Button 
          variant="exoseer" 
          size="sm" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze(candidate);
          }}
          data-testid="analyze-candidate-button"
        >
          Analyze
        </Button>
      </CardContent>
    </Card>
  );
};

const CandidateList = ({ 
  candidates = [], 
  selectedCandidate, 
  onSelectCandidate, 
  onAnalyzeCandidate,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="candidates-loading">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-gray-700">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded mb-2"></div>
                <div className="h-2 bg-gray-800 rounded mb-3"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-3 bg-gray-800 rounded"></div>
                  <div className="h-3 bg-gray-800 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (candidates.length === 0) {
    return (
      <Card className="border-gray-700" data-testid="no-candidates">
        <CardContent className="p-6 text-center">
          <div className="text-gray-400 mb-2">No candidates found</div>
          <div className="text-xs text-gray-500">
            Try searching for a different target or check your query
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-0" data-testid="candidates-list">
      <div className="mb-3 text-sm text-gray-400">
        Found {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
      </div>
      {candidates.map((candidate, index) => (
        <CandidateCard
          key={candidate.id || candidate.name || index}
          candidate={candidate}
          isSelected={selectedCandidate?.name === candidate.name}
          onSelect={onSelectCandidate}
          onAnalyze={onAnalyzeCandidate}
        />
      ))}
    </div>
  );
};

export default CandidateList;