#!/usr/bin/env python3
"""
NASA Data Integration and Candidate Analysis System Test
Focused testing for the review request requirements
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, List

class NASAIntegrationTester:
    def __init__(self, base_url="https://stargaze-preview.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    def test_analyze_endpoint(self) -> bool:
        """Test /api/analyze endpoint with candidate data"""
        print("\n🔬 TESTING /api/analyze ENDPOINT")
        print("=" * 50)
        
        # Test with different candidates to ensure candidate-specific processing
        test_candidates = [
            {
                "target_name": "Kepler-452 b",
                "candidate_data": {
                    "orbital_period": 384.843,
                    "radius_earth": 1.63,
                    "transit_depth": 0.000084,
                    "confidence": 0.85,
                    "sector": 26
                }
            },
            {
                "target_name": "TRAPPIST-1 e", 
                "candidate_data": {
                    "orbital_period": 6.099,
                    "radius_earth": 0.92,
                    "transit_depth": 0.00051,
                    "confidence": 0.92,
                    "sector": 27
                }
            },
            {
                "target_name": "TOI-715 b",
                "candidate_data": {
                    "orbital_period": 19.28,
                    "radius_earth": 1.55,
                    "transit_depth": 0.00023,
                    "confidence": 0.78,
                    "sector": 28
                }
            }
        ]
        
        all_passed = True
        analysis_results = []
        
        for i, candidate in enumerate(test_candidates, 1):
            print(f"\n📊 Test {i}: Analyzing {candidate['target_name']}")
            
            try:
                response = self.session.post(
                    f"{self.api_url}/analyze",
                    json=candidate,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    analysis_results.append(data)
                    
                    # Verify comprehensive analysis results
                    required_sections = [
                        'light_curve_analysis',
                        'centroid_analysis', 
                        'physics_analysis',
                        'validation'
                    ]
                    
                    missing_sections = []
                    for section in required_sections:
                        if section not in data:
                            missing_sections.append(section)
                    
                    if missing_sections:
                        self.log_test(
                            f"Analyze {candidate['target_name']} - Complete Analysis",
                            False,
                            f"Missing sections: {missing_sections}"
                        )
                        all_passed = False
                    else:
                        # Check candidate-specific data
                        lc_analysis = data.get('light_curve_analysis', {})
                        target_name = lc_analysis.get('target_name')
                        period = lc_analysis.get('period')
                        
                        if target_name == candidate['target_name']:
                            self.log_test(
                                f"Analyze {candidate['target_name']} - Candidate-Specific Processing",
                                True,
                                f"Period: {period}, Target: {target_name}"
                            )
                        else:
                            self.log_test(
                                f"Analyze {candidate['target_name']} - Candidate-Specific Processing",
                                False,
                                f"Expected {candidate['target_name']}, got {target_name}"
                            )
                            all_passed = False
                        
                        # Verify physics analysis parameters
                        physics = data.get('physics_analysis', {})
                        physics_params = ['period', 'radius_ratio', 'stellar_density', 'equilibrium_temp']
                        physics_present = [param for param in physics_params if param in physics]
                        
                        self.log_test(
                            f"Analyze {candidate['target_name']} - Physics Parameters",
                            len(physics_present) >= 3,
                            f"Present: {physics_present}"
                        )
                        
                        # Verify validation data
                        validation = data.get('validation', {})
                        validation_fields = ['false_positive_probability', 'validation_score', 'disposition']
                        validation_present = [field for field in validation_fields if field in validation]
                        
                        self.log_test(
                            f"Analyze {candidate['target_name']} - Validation Data",
                            len(validation_present) >= 2,
                            f"Present: {validation_present}"
                        )
                        
                else:
                    self.log_test(
                        f"Analyze {candidate['target_name']} - API Response",
                        False,
                        f"Status: {response.status_code}, Response: {response.text[:200]}"
                    )
                    all_passed = False
                    
            except Exception as e:
                self.log_test(
                    f"Analyze {candidate['target_name']} - Request",
                    False,
                    f"Error: {str(e)}"
                )
                all_passed = False
        
        # Test unique analysis results
        if len(analysis_results) >= 2:
            result1 = analysis_results[0].get('light_curve_analysis', {})
            result2 = analysis_results[1].get('light_curve_analysis', {})
            
            unique_data = (
                result1.get('target_name') != result2.get('target_name') or
                result1.get('period') != result2.get('period') or
                result1.get('analysis_timestamp') != result2.get('analysis_timestamp')
            )
            
            self.log_test(
                "Unique Analysis Results Per Candidate",
                unique_data,
                f"Different timestamps: {result1.get('analysis_timestamp') != result2.get('analysis_timestamp')}"
            )
        
        return all_passed
    
    def test_nasa_archive_integration(self) -> bool:
        """Test NASA Archive integration via lightcurves endpoint"""
        print("\n🛰️ TESTING NASA ARCHIVE INTEGRATION")
        print("=" * 50)
        
        # Test with real exoplanet names
        test_targets = [
            "Kepler-452b",
            "TRAPPIST-1b", 
            "TOI-715b",
            "Invalid-Target-12345"  # Should handle gracefully
        ]
        
        all_passed = True
        
        for target in test_targets:
            print(f"\n📡 Testing light curve data for: {target}")
            
            try:
                response = self.session.get(
                    f"{self.api_url}/lightcurves/{target}",
                    params={"mission": "TESS"},
                    timeout=45
                )
                
                if target == "Invalid-Target-12345":
                    # Should return 404 for invalid targets
                    if response.status_code == 404:
                        self.log_test(
                            f"NASA Archive - Error Handling ({target})",
                            True,
                            "Correctly returned 404 for invalid target"
                        )
                    else:
                        self.log_test(
                            f"NASA Archive - Error Handling ({target})",
                            False,
                            f"Expected 404, got {response.status_code}"
                        )
                        all_passed = False
                else:
                    # Real targets - check response structure
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Verify response structure
                        required_fields = ['target_name', 'mission', 'light_curve', 'timestamp']
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if missing_fields:
                            self.log_test(
                                f"NASA Archive - Response Structure ({target})",
                                False,
                                f"Missing fields: {missing_fields}"
                            )
                            all_passed = False
                        else:
                            light_curve = data.get('light_curve', {})
                            data_points = light_curve.get('length', 0)
                            
                            self.log_test(
                                f"NASA Archive - Data Retrieval ({target})",
                                data_points > 0,
                                f"Retrieved {data_points} data points"
                            )
                            
                            if data_points == 0:
                                all_passed = False
                    
                    elif response.status_code == 404:
                        # Some targets might not have TESS data - this is acceptable
                        self.log_test(
                            f"NASA Archive - No Data Available ({target})",
                            True,
                            "No TESS data available (acceptable)"
                        )
                    else:
                        self.log_test(
                            f"NASA Archive - API Response ({target})",
                            False,
                            f"Status: {response.status_code}, Response: {response.text[:200]}"
                        )
                        all_passed = False
                        
            except Exception as e:
                self.log_test(
                    f"NASA Archive - Request ({target})",
                    False,
                    f"Error: {str(e)}"
                )
                all_passed = False
        
        return all_passed
    
    def test_search_functionality(self) -> bool:
        """Test search functionality with NASA Exoplanet Archive integration"""
        print("\n🔍 TESTING SEARCH FUNCTIONALITY")
        print("=" * 50)
        
        # Test various search terms
        search_tests = [
            {
                "query": "Kepler-452",
                "expected_min_results": 1,
                "description": "Kepler planet search"
            },
            {
                "query": "TRAPPIST-1",
                "expected_min_results": 3,
                "description": "Multi-planet system search"
            },
            {
                "query": "TIC 100100827",
                "expected_min_results": 1,
                "description": "TIC ID search"
            },
            {
                "query": "NonExistentPlanet12345",
                "expected_min_results": 0,
                "description": "Invalid target search"
            }
        ]
        
        all_passed = True
        
        for test in search_tests:
            print(f"\n🔎 Testing: {test['description']}")
            
            try:
                response = self.session.post(
                    f"{self.api_url}/targets/search",
                    json={
                        "target_name": test["query"],
                        "search_type": "auto"
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get('candidates', [])
                    total_found = data.get('total_found', 0)
                    
                    # Check minimum expected results
                    meets_expectation = total_found >= test['expected_min_results']
                    
                    self.log_test(
                        f"Search - {test['description']}",
                        meets_expectation,
                        f"Found {total_found} candidates (expected >= {test['expected_min_results']})"
                    )
                    
                    if not meets_expectation:
                        all_passed = False
                    
                    # Verify NASA integration by checking candidate data structure
                    if candidates:
                        first_candidate = candidates[0]
                        nasa_fields = ['name', 'host_star', 'discovery_method', 'orbital_period', 'radius_earth']
                        present_fields = [field for field in nasa_fields if field in first_candidate and first_candidate[field] is not None]
                        
                        self.log_test(
                            f"Search - NASA Data Integration ({test['query']})",
                            len(present_fields) >= 3,
                            f"NASA fields present: {present_fields}"
                        )
                        
                        if len(present_fields) < 3:
                            all_passed = False
                
                else:
                    self.log_test(
                        f"Search - API Response ({test['query']})",
                        False,
                        f"Status: {response.status_code}, Response: {response.text[:200]}"
                    )
                    all_passed = False
                    
            except Exception as e:
                self.log_test(
                    f"Search - Request ({test['query']})",
                    False,
                    f"Error: {str(e)}"
                )
                all_passed = False
        
        return all_passed
    
    def test_backend_data_processing(self) -> bool:
        """Test backend data processing for unique candidate results"""
        print("\n⚙️ TESTING BACKEND DATA PROCESSING")
        print("=" * 50)
        
        # Test that physics parameters are calculated correctly
        test_data = {
            "target_name": "Test-Candidate-Physics",
            "candidate_data": {
                "orbital_period": 10.5,
                "radius_earth": 1.2,
                "transit_depth": 0.001,
                "confidence": 0.8,
                "sector": 30
            }
        }
        
        all_passed = True
        
        try:
            response = self.session.post(
                f"{self.api_url}/analyze",
                json=test_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Test physics parameter calculations
                physics = data.get('physics_analysis', {})
                
                # Check that physics parameters are present and reasonable
                physics_checks = [
                    ('period', lambda x: 5 < x < 20),
                    ('radius_ratio', lambda x: 0.01 < x < 0.2),
                    ('stellar_density', lambda x: 0.1 < x < 10),
                    ('equilibrium_temp', lambda x: 100 < x < 3000),
                    ('consistency_score', lambda x: 0 <= x <= 1)
                ]
                
                physics_valid = True
                physics_details = []
                
                for param, validator in physics_checks:
                    value = physics.get(param)
                    if value is not None:
                        is_valid = validator(value)
                        physics_details.append(f"{param}: {value} ({'✓' if is_valid else '✗'})")
                        if not is_valid:
                            physics_valid = False
                    else:
                        physics_details.append(f"{param}: missing")
                        physics_valid = False
                
                self.log_test(
                    "Backend - Physics Parameter Calculation",
                    physics_valid,
                    "; ".join(physics_details)
                )
                
                if not physics_valid:
                    all_passed = False
                
                # Test timestamp generation
                lc_analysis = data.get('light_curve_analysis', {})
                timestamp = lc_analysis.get('analysis_timestamp')
                
                timestamp_valid = timestamp is not None and len(timestamp) > 10
                self.log_test(
                    "Backend - Analysis Timestamp Generation",
                    timestamp_valid,
                    f"Timestamp: {timestamp}"
                )
                
                if not timestamp_valid:
                    all_passed = False
                
                # Test validation data generation
                validation = data.get('validation', {})
                validation_fields = ['false_positive_probability', 'validation_score', 'disposition']
                validation_present = sum(1 for field in validation_fields if field in validation)
                
                validation_valid = validation_present >= 2
                self.log_test(
                    "Backend - Validation Data Generation",
                    validation_valid,
                    f"Validation fields present: {validation_present}/3"
                )
                
                if not validation_valid:
                    all_passed = False
            
            else:
                self.log_test(
                    "Backend - Data Processing API",
                    False,
                    f"Status: {response.status_code}, Response: {response.text[:200]}"
                )
                all_passed = False
                
        except Exception as e:
            self.log_test(
                "Backend - Data Processing Request",
                False,
                f"Error: {str(e)}"
            )
            all_passed = False
        
        return all_passed
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all NASA integration tests"""
        print("🚀 NASA DATA INTEGRATION & CANDIDATE ANALYSIS SYSTEM TEST")
        print("=" * 70)
        print(f"Testing against: {self.base_url}")
        print(f"Started at: {datetime.utcnow().isoformat()}")
        
        # Run all test suites
        test_suites = [
            ("Analyze Endpoint", self.test_analyze_endpoint),
            ("NASA Archive Integration", self.test_nasa_archive_integration),
            ("Search Functionality", self.test_search_functionality),
            ("Backend Data Processing", self.test_backend_data_processing)
        ]
        
        suite_results = {}
        
        for suite_name, test_func in test_suites:
            print(f"\n{'='*70}")
            print(f"🧪 RUNNING: {suite_name.upper()}")
            print(f"{'='*70}")
            
            try:
                result = test_func()
                suite_results[suite_name] = result
                status = "✅ PASSED" if result else "❌ FAILED"
                print(f"\n{status} {suite_name}")
            except Exception as e:
                suite_results[suite_name] = False
                print(f"\n❌ FAILED {suite_name} - Exception: {str(e)}")
        
        # Calculate overall results
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Print summary
        print(f"\n{'='*70}")
        print("📊 FINAL TEST SUMMARY")
        print(f"{'='*70}")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print(f"\n📋 Suite Results:")
        for suite_name, result in suite_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} {suite_name}")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests Details:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': success_rate,
            'suite_results': suite_results,
            'test_details': self.test_results
        }

def main():
    """Main test execution"""
    tester = NASAIntegrationTester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    return 0 if results['failed_tests'] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())