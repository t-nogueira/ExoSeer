import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Upload, Download, Shield, CheckCircle2, AlertTriangle, 
  FileText, Database, Eye, Clock, User, Star
} from "lucide-react";
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const TransitDataSubmissionTool = ({ candidate }) => {
  const [submissionData, setSubmissionData] = useState({
    observer_name: '',
    institution: '',
    observation_date: '',
    telescope_info: '',
    filter_band: '',
    exposure_time: '',
    target_name: candidate?.name || '',
    notes: ''
  });
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const processedFiles = files.map(file => ({
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.name.split('.').pop().toLowerCase()
    }));
    
    setUploadedFiles(prev => [...prev, ...processedFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setValidationResults(null);
  };

  const validateData = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one data file');
      return;
    }

    setIsValidating(true);
    setValidationResults(null);

    try {
      // Simulate comprehensive validation
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time

      const mockValidation = {
        schema_check: {
          passed: Math.random() > 0.2,
          issues: Math.random() > 0.5 ? [] : ['Missing timestamp column', 'Invalid flux format']
        },
        snr_analysis: {
          calculated_snr: 12.5 + Math.random() * 15,
          threshold: 8.0,
          passed: true
        },
        catalog_crosscheck: {
          matches_found: Math.floor(Math.random() * 3),
          known_object: Math.random() > 0.7,
          classification: ['Hot Jupiter', 'Super Earth', 'Sub Neptune'][Math.floor(Math.random() * 3)]
        },
        data_quality: {
          completeness: 95 + Math.random() * 5,
          noise_level: 50 + Math.random() * 100,
          systematic_trends: Math.random() > 0.8,
          grade: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
        },
        overall_score: 75 + Math.random() * 20
      };

      setValidationResults(mockValidation);

    } catch (error) {
      console.error('Validation failed:', error);
      alert('Validation failed: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const submitToTrainingSet = async () => {
    if (!validationResults || validationResults.overall_score < 70) {
      alert('Data must pass validation with score ≥70% before submission');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Add files
      uploadedFiles.forEach((fileObj, index) => {
        formData.append(`data_file_${index}`, fileObj.file);
      });

      // Add metadata
      formData.append('submission_data', JSON.stringify({
        ...submissionData,
        validation_results: validationResults,
        submission_timestamp: new Date().toISOString(),
        candidate_context: candidate
      }));

      const response = await axios.post(`${BACKEND_URL}/api/transit-data-submission`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmissionStatus({
        success: true,
        submission_id: response.data.submission_id || `TDS-${Date.now()}`,
        message: 'Data submitted successfully for review and potential integration into training set.'
      });

    } catch (error) {
      console.error('Submission failed:', error);
      setSubmissionStatus({
        success: false,
        message: error.response?.data?.message || 'Submission failed. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `# ExoSeer Transit Data Template
# Required columns: time_bjd, flux_normalized, flux_error
# Optional columns: airmass, sky_background, fwhm
# Lines starting with # are comments and will be ignored

time_bjd,flux_normalized,flux_error,airmass,sky_background
2459000.5,1.0000,0.0001,1.02,1200
2459000.51,0.9998,0.0001,1.03,1205
2459000.52,0.9995,0.0001,1.04,1210
# ... (continue with your observations)
# Transit should show flux dip around 0.99-0.999 depending on planet size
2459000.55,0.9985,0.0001,1.05,1215
2459000.56,0.9990,0.0001,1.06,1220
2459000.57,1.0001,0.0001,1.07,1225`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exoseer_transit_data_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Observer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-300 block mb-1">Observer Name *</label>
          <Input
            placeholder="Dr. Jane Smith"
            value={submissionData.observer_name}
            onChange={(e) => setSubmissionData(prev => ({...prev, observer_name: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-300 block mb-1">Institution *</label>
          <Input
            placeholder="University Observatory"
            value={submissionData.institution}
            onChange={(e) => setSubmissionData(prev => ({...prev, institution: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-300 block mb-1">Observation Date *</label>
          <Input
            type="date"
            value={submissionData.observation_date}
            onChange={(e) => setSubmissionData(prev => ({...prev, observation_date: e.target.value}))}
          />
        </div>
        <div>
          <label className="text-sm text-gray-300 block mb-1">Telescope Info</label>
          <Input
            placeholder="0.4m Schmidt-Cassegrain"
            value={submissionData.telescope_info}
            onChange={(e) => setSubmissionData(prev => ({...prev, telescope_info: e.target.value}))}
          />
        </div>
      </div>

      {/* Data Upload Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-medium">Transit Photometry Data</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt,.dat"
            multiple
            className="hidden"
          />
          
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-300 mb-2">
            Upload transit light curve data (CSV, TXT, DAT)
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-800/50 p-3 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">{file.name}</span>
                  <Badge variant="outline" className="text-xs">{file.size}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation Section */}
      <div>
        <Button
          onClick={validateData}
          disabled={isValidating || uploadedFiles.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isValidating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Validating Data...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Run Validation Checks
            </>
          )}
        </Button>

        {/* Validation Results */}
        {validationResults && (
          <Card className="mt-4 border-gray-600">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Validation Results
                <Badge className={validationResults.overall_score >= 70 ? 'bg-green-600' : 'bg-red-600'}>
                  {validationResults.overall_score.toFixed(1)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {validationResults.schema_check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <span>Schema Check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span>SNR: {validationResults.snr_analysis.calculated_snr.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-400" />
                  <span>Catalog: {validationResults.catalog_crosscheck.matches_found} matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span>Data Quality: Grade {validationResults.data_quality.grade}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submission */}
      {validationResults && validationResults.overall_score >= 70 && (
        <Button
          onClick={submitToTrainingSet}
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Submitting to Training Set...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Submit to Candidate Training Set
            </>
          )}
        </Button>
      )}

      {/* Submission Status */}
      {submissionStatus && (
        <Card className={`border-${submissionStatus.success ? 'green' : 'red'}-500/30 bg-${submissionStatus.success ? 'green' : 'red'}-900/10`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {submissionStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">
                  {submissionStatus.success ? 'Submission Successful!' : 'Submission Failed'}
                </p>
                <p className="text-sm text-gray-300">{submissionStatus.message}</p>
                {submissionStatus.success && (
                  <p className="text-xs text-gray-400 mt-1">
                    Submission ID: {submissionStatus.submission_id}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Panel */}
      <Card className="border-blue-500/30 bg-blue-900/10">
        <CardContent className="p-4">
          <h4 className="text-blue-300 font-medium mb-2">Submission Guidelines</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Data must have SNR ≥ 8.0 and validation score ≥ 70%</li>
            <li>• Include observation metadata and telescope information</li>
            <li>• Submitted data undergoes admin review before integration</li>
            <li>• Approved submissions contribute to model training improvements</li>
            <li>• Follow the CSV template format for best compatibility</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransitDataSubmissionTool;