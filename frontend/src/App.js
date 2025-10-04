import React, { useState, useCallback } from "react";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Switch } from "./components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import CandidateList from "./components/CandidateList";
import AnalysisPanel from "./components/AnalysisPanel";
import { Search, Upload, Download, BarChart3, Telescope } from "lucide-react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  // State management
  const [userMode, setUserMode] = useState('scientist'); // 'novice' or 'scientist'
  const [targetName, setTargetName] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // API functions
  const searchTargets = useCallback(async (targetName) => {
    if (!targetName.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/targets/search`, {
        target_name: targetName,
        search_type: 'auto'
      });
      
      setSearchResults(response.data);
      setCandidates(response.data.candidates || []);
      setSelectedCandidate(null);
      setAnalysisResult(null);
      
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
      setCandidates([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const runAnalysis = useCallback(async (candidate) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/analyze/complete`, {
        target_name: candidate.name || candidate.host_star,
        analysis_types: ['light_curve', 'transit', 'centroid', 'uncertainty'],
        user_mode: userMode,
        custom_parameters: null
      });
      
      setAnalysisResult(response.data);
      setSelectedCandidate(candidate);
      
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [userMode]);

  const handleExportPDF = useCallback(async (analysisId) => {
    try {
      const response = await axios.post(`${API}/export/pdf/${analysisId}`, {
        export_type: 'pdf',
        include_plots: true
      });
      
      // For now, just show the response (PDF generation would be implemented with proper libraries)
      alert('PDF export requested. Check console for details.');
      console.log('PDF Export:', response.data);
      
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('PDF export failed. Please try again.');
    }
  }, []);

  const handleExportCSV = useCallback(async (analysisId) => {
    try {
      const response = await axios.get(`${API}/export/csv/${analysisId}`);
      
      if (response.data.csv_data) {
        // Create and download CSV file
        const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename || 'exoseer_analysis.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
    } catch (err) {
      console.error('CSV export failed:', err);
      setError('CSV export failed. Please try again.');
    }
  }, []);

  const handleSearch = () => {
    searchTargets(targetName);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" data-testid="exoseer-app">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Telescope className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl font-bold text-white" data-testid="app-title">ExoSeer</h1>
              </div>
              <p className="text-sm text-gray-400 hidden md:block">
                Advanced AI system for exoplanet candidate detection and vetting using multimodal deep learning with physics-informed constraints and uncertainty calibration
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Novice Mode</span>
                <Switch 
                  checked={userMode === 'scientist'} 
                  onCheckedChange={(checked) => setUserMode(checked ? 'scientist' : 'novice')}
                  data-testid="user-mode-switch"
                />
                <span className="text-sm text-gray-400">Scientist Mode</span>
              </div>
              
              {/* Space-themed background image */}
              <div className="w-20 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 overflow-hidden hidden lg:block">
                <div className="w-full h-full bg-black/30 flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-80"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="border-b border-gray-800 bg-black/10">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8 py-3">
            <a href="#" className="text-blue-400 border-b-2 border-blue-400 pb-2 text-sm font-medium" data-testid="nav-analysis">
              Analysis
            </a>
            <a href="#" className="text-gray-400 hover:text-white pb-2 text-sm font-medium">
              Missions
            </a>
            <a href="#" className="text-gray-400 hover:text-white pb-2 text-sm font-medium">
              Architecture
            </a>
            <a href="#" className="text-gray-400 hover:text-white pb-2 text-sm font-medium">
              Passport
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Target Selection */}
        <Card className="mb-6 border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Search className="w-5 h-5" />
              Target Selection
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Enter a planet name, TIC number, or star name to search NASA data
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. TIC 114, Kepler 657, K2 18, HD 209458"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                data-testid="target-search-input"
              />
              <Button 
                variant="exoseer" 
                onClick={handleSearch}
                disabled={isSearching || !targetName.trim()}
                data-testid="analyze-button"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? 'Searching...' : 'Analyze'}
              </Button>
              <Button variant="exoseer_outline" data-testid="upload-button">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-900/20" data-testid="error-card">
            <CardContent className="p-4">
              <div className="text-red-400 text-sm">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates Panel */}
          <div className="lg:col-span-1">
            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Candidates
                  {searchResults && (
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      ({searchResults.total_found} found)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CandidateList
                  candidates={candidates}
                  selectedCandidate={selectedCandidate}
                  onSelectCandidate={setSelectedCandidate}
                  onAnalyzeCandidate={runAnalysis}
                  isLoading={isSearching}
                />
              </CardContent>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-2">
            <AnalysisPanel
              analysisResult={analysisResult}
              isAnalyzing={isAnalyzing}
              onExportPDF={handleExportPDF}
              onExportCSV={handleExportCSV}
            />
          </div>
        </div>

        {/* Export & Documentation Section */}
        {analysisResult && (
          <Card className="mt-6 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export & Documentation
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Generate candidate reports and export analysis results
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="exoseer_outline"
                  onClick={() => handleExportPDF(analysisResult.analysis_id)}
                  data-testid="generate-report-pdf"
                >
                  Generate Passport PDF
                </Button>
                <Button 
                  variant="exoseer_outline"
                  onClick={() => handleExportCSV(analysisResult.analysis_id)}
                  data-testid="export-data-csv"
                >
                  Export Data (CSV)
                </Button>
                <Button 
                  variant="exoseer_outline"
                  data-testid="share-analysis-main"
                >
                  Share Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/20 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-400 text-sm">
            <p>ExoSeer v1.0.0 - Advanced Exoplanet Detection & Vetting System</p>
            <p className="mt-1">Powered by NASA APIs, AI Analysis, and Physics-Informed Models</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
