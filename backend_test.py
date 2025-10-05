import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, List

class ExoSeerAPITester:
    def __init__(self, base_url="https://stargaze-preview.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict[str, Any] = None, timeout: int = 30) -> tuple[bool, Dict[str, Any]]:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        self.tests_run += 1
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, timeout=timeout)
            elif method == 'POST':
                response = self.session.post(url, json=data, timeout=timeout)
            elif method == 'PUT':
                response = self.session.put(url, json=data, timeout=timeout)
            elif method == 'DELETE':
                response = self.session.delete(url, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {"raw_response": response.text}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:500]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout after {timeout}s")
            self.failed_tests.append({'name': name, 'error': 'timeout'})
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({'name': name, 'error': str(e)})
            return False, {}

    def test_health_check(self) -> bool:
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        
        if success and response:
            print(f"   Services: {response.get('services', {})}")
        
        return success

    def test_root_endpoint(self) -> bool:
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        
        if success and response:
            print(f"   Message: {response.get('message', 'N/A')}")
            print(f"   Version: {response.get('version', 'N/A')}")
        
        return success

    def test_target_search(self, target_name: str = "Kepler-452") -> tuple[bool, List[Dict[str, Any]]]:
        """Test target search functionality"""
        success, response = self.run_test(
            f"Target Search ({target_name})",
            "POST",
            "targets/search",
            200,
            data={
                "target_name": target_name,
                "search_type": "auto"
            }
        )
        
        candidates = []
        if success and response:
            candidates = response.get('candidates', [])
            total_found = response.get('total_found', 0)
            print(f"   Found {total_found} candidates")
            
            if candidates:
                first_candidate = candidates[0]
                print(f"   First candidate: {first_candidate.get('name', 'Unknown')}")
                print(f"   Host star: {first_candidate.get('host_star', 'Unknown')}")
                print(f"   Status: {first_candidate.get('status', 'Unknown')}")
        
        return success, candidates

    def test_target_details(self, target_name: str) -> bool:
        """Test target details endpoint"""
        success, response = self.run_test(
            f"Target Details ({target_name})",
            "GET",
            f"targets/{target_name}/details",
            200
        )
        
        if success and response:
            details = response.get('details', {})
            print(f"   Details keys: {list(details.keys())[:5]}...")
        
        return success

    def test_light_curve_data(self, target_name: str) -> bool:
        """Test light curve data retrieval"""
        success, response = self.run_test(
            f"Light Curve Data ({target_name})",
            "GET",
            f"lightcurves/{target_name}?mission=TESS",
            200,
            timeout=45  # Light curve data can take longer
        )
        
        if success and response:
            light_curve = response.get('light_curve', {})
            if light_curve:
                print(f"   Data points: {light_curve.get('length', 0)}")
                print(f"   Mission: {light_curve.get('mission', 'Unknown')}")
                print(f"   Sector: {light_curve.get('sector', 'Unknown')}")
        
        return success

    def test_complete_analysis(self, target_name: str) -> tuple[bool, str]:
        """Test complete analysis pipeline"""
        success, response = self.run_test(
            f"Complete Analysis ({target_name})",
            "POST",
            "analyze/complete",
            200,
            data={
                "target_name": target_name,
                "analysis_types": ["light_curve", "transit", "centroid", "uncertainty"],
                "user_mode": "scientist",
                "custom_parameters": None
            },
            timeout=60  # Analysis can take longer
        )
        
        analysis_id = ""
        if success and response:
            analysis_id = response.get('analysis_id', '')
            analyses = response.get('analyses', {})
            candidate = response.get('candidate', {})
            
            print(f"   Analysis ID: {analysis_id}")
            print(f"   Analysis types: {list(analyses.keys())}")
            print(f"   Candidate: {candidate.get('name', 'Unknown')}")
            
            # Check specific analysis results
            if 'transit_analysis' in analyses:
                transit = analyses['transit_analysis']
                print(f"   Transit period: {transit.get('period', 'N/A')} days")
                print(f"   Transit depth: {transit.get('depth', 'N/A')}")
                print(f"   SNR: {transit.get('snr', 'N/A')}")
            
            if 'ensemble_predictions' in analyses:
                ensemble = analyses['ensemble_predictions']
                print(f"   Planet probability: {ensemble.get('planet_probability', 'N/A')}")
                print(f"   Recommendation: {ensemble.get('decision_recommendation', 'N/A')}")
        
        return success, analysis_id

    def test_get_analysis_result(self, analysis_id: str) -> bool:
        """Test retrieving stored analysis result"""
        if not analysis_id:
            print("⚠️  Skipping analysis retrieval - no analysis ID")
            return True
        
        success, response = self.run_test(
            f"Get Analysis Result ({analysis_id[:8]}...)",
            "GET",
            f"analyze/{analysis_id}",
            200
        )
        
        if success and response:
            print(f"   Retrieved analysis for: {response.get('target_name', 'Unknown')}")
        
        return success

    def test_export_csv(self, analysis_id: str) -> bool:
        """Test CSV export functionality"""
        if not analysis_id:
            print("⚠️  Skipping CSV export - no analysis ID")
            return True
        
        success, response = self.run_test(
            f"Export CSV ({analysis_id[:8]}...)",
            "GET",
            f"export/csv/{analysis_id}",
            200
        )
        
        if success and response:
            csv_data = response.get('csv_data', '')
            filename = response.get('filename', 'unknown')
            print(f"   CSV filename: {filename}")
            print(f"   CSV data length: {len(csv_data)} characters")
        
        return success

    def test_export_pdf(self, analysis_id: str) -> bool:
        """Test PDF export functionality"""
        if not analysis_id:
            print("⚠️  Skipping PDF export - no analysis ID")
            return True
        
        success, response = self.run_test(
            f"Export PDF ({analysis_id[:8]}...)",
            "POST",
            f"export/pdf/{analysis_id}",
            200,
            data={
                "export_type": "pdf",
                "include_plots": True
            }
        )
        
        if success and response:
            message = response.get('message', '')
            print(f"   Export message: {message}")
        
        return success

    def test_recent_candidates(self) -> bool:
        """Test recent candidates endpoint"""
        success, response = self.run_test(
            "Recent Candidates",
            "GET",
            "candidates/recent?limit=5",
            200
        )
        
        if success and response:
            candidates = response.get('recent_candidates', [])
            count = response.get('count', 0)
            print(f"   Recent candidates count: {count}")
        
        return success

    def test_analysis_stats(self) -> bool:
        """Test analysis statistics endpoint"""
        success, response = self.run_test(
            "Analysis Statistics",
            "GET",
            "stats/summary",
            200
        )
        
        if success and response:
            total = response.get('total_analyses', 0)
            confirmed = response.get('confirmed_planets', 0)
            candidates = response.get('planet_candidates', 0)
            print(f"   Total analyses: {total}")
            print(f"   Confirmed planets: {confirmed}")
            print(f"   Planet candidates: {candidates}")
        
        return success

    def test_upload_light_curve(self) -> bool:
        """Test light curve upload functionality"""
        # Create sample CSV data
        csv_data = """time,flux,flux_err
1354.5,1.0000,0.0001
1354.501,0.9999,0.0001
1354.502,0.9998,0.0001
1354.503,0.9995,0.0001
1354.504,0.9998,0.0001
1354.505,1.0001,0.0001"""
        
        success, response = self.run_test(
            "Upload Light Curve",
            "POST",
            "lightcurves/upload",
            200,
            data={
                "target_name": "Test Upload",
                "time_column": "time",
                "flux_column": "flux",
                "error_column": "flux_err",
                "csv_data": csv_data
            }
        )
        
        if success and response:
            light_curve = response.get('light_curve', {})
            print(f"   Uploaded data points: {light_curve.get('length', 0)}")
        
        return success

    def test_ai_physics_chat(self) -> bool:
        """Test AI Physics Chat endpoint with NASA-level physics questions"""
        print("\n🤖 AI Physics Chat Tests")
        
        # Test basic physics question
        success1, response1 = self.run_test(
            "AI Chat - Transit Depth Physics",
            "POST",
            "ai-chat",
            200,
            data={
                "message": "Explain transit depth calculations for exoplanets",
                "context": {
                    "candidate_name": "Kepler-452 b",
                    "period": 384.843,
                    "radius": 1.63,
                    "transit_depth": 0.000084
                },
                "conversation_history": []
            }
        )
        
        if success1 and response1:
            print(f"   Response length: {len(response1.get('response', ''))}")
            print(f"   Confidence: {response1.get('confidence', 'N/A')}")
            print(f"   References: {len(response1.get('references', []))}")
            print(f"   Mode: {response1.get('mode', 'N/A')}")
        
        # Test impact parameter physics
        success2, response2 = self.run_test(
            "AI Chat - Impact Parameter Physics",
            "POST",
            "ai-chat",
            200,
            data={
                "message": "What is impact parameter and how does it affect transit observations?",
                "context": {
                    "candidate_name": "TRAPPIST-1 e",
                    "period": 6.099,
                    "radius": 0.92
                },
                "conversation_history": []
            }
        )
        
        if success2 and response2:
            print(f"   Impact parameter response confidence: {response2.get('confidence', 'N/A')}")
        
        # Test limb darkening effects
        success3, response3 = self.run_test(
            "AI Chat - Limb Darkening Effects",
            "POST",
            "ai-chat",
            200,
            data={
                "message": "How does limb darkening affect transit photometry?",
                "context": None,
                "conversation_history": []
            }
        )
        
        if success3 and response3:
            print(f"   Limb darkening response confidence: {response3.get('confidence', 'N/A')}")
        
        # Test chi-squared fit quality
        success4, response4 = self.run_test(
            "AI Chat - Chi-squared Fit Quality",
            "POST",
            "ai-chat",
            200,
            data={
                "message": "Explain chi-squared values in exoplanet transit fitting",
                "context": None,
                "conversation_history": []
            }
        )
        
        if success4 and response4:
            print(f"   Chi-squared response confidence: {response4.get('confidence', 'N/A')}")
        
        # Test false positive scenarios
        success5, response5 = self.run_test(
            "AI Chat - False Positive Scenarios",
            "POST",
            "ai-chat",
            200,
            data={
                "message": "What are common false positive scenarios in exoplanet detection?",
                "context": None,
                "conversation_history": []
            }
        )
        
        if success5 and response5:
            print(f"   False positive response confidence: {response5.get('confidence', 'N/A')}")
        
        # Test error handling - empty message
        success6, response6 = self.run_test(
            "AI Chat - Error Handling (Empty Message)",
            "POST",
            "ai-chat",
            400,
            data={
                "message": "",
                "context": None,
                "conversation_history": []
            }
        )
        
        # Test conversation history
        success7, response7 = self.run_test(
            "AI Chat - Conversation History",
            "POST",
            "ai-chat",
            200,
            data={
                "message": "Can you elaborate on that?",
                "context": None,
                "conversation_history": [
                    {"role": "user", "content": "What is transit depth?"},
                    {"role": "assistant", "content": "Transit depth is the fractional decrease in stellar flux..."}
                ]
            }
        )
        
        if success7 and response7:
            print(f"   Conversation history response confidence: {response7.get('confidence', 'N/A')}")
        
        # Calculate overall AI chat success
        ai_chat_tests = [success1, success2, success3, success4, success5, success6, success7]
        ai_chat_success = sum(ai_chat_tests) / len(ai_chat_tests)
        
        print(f"\n   AI Chat Overall Success: {ai_chat_success*100:.1f}% ({sum(ai_chat_tests)}/{len(ai_chat_tests)} tests passed)")
        
        return ai_chat_success >= 0.8  # 80% success rate required

    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive API test suite"""
        print("🚀 Starting ExoSeer API Comprehensive Test Suite")
        print("=" * 60)
        
        # Basic connectivity tests
        print("\n📡 Basic Connectivity Tests")
        self.test_health_check()
        self.test_root_endpoint()
        
        # Target search tests
        print("\n🔍 Target Search Tests")
        search_success, candidates = self.test_target_search("Kepler-452")
        
        # Use first candidate for detailed tests
        test_target = "Kepler-452 b"
        if candidates:
            test_target = candidates[0].get('name', test_target)
        
        self.test_target_details(test_target)
        
        # Light curve tests
        print("\n📊 Light Curve Tests")
        self.test_light_curve_data(test_target)
        self.test_upload_light_curve()
        
        # Analysis tests
        print("\n🧠 Analysis Pipeline Tests")
        analysis_success, analysis_id = self.test_complete_analysis(test_target)
        
        # Export tests
        print("\n📤 Export Tests")
        self.test_get_analysis_result(analysis_id)
        self.test_export_csv(analysis_id)
        self.test_export_pdf(analysis_id)
        
        # Statistics tests
        print("\n📈 Statistics Tests")
        self.test_recent_candidates()
        self.test_analysis_stats()
        
        # AI Physics Chat tests
        print("\n🤖 AI Physics Chat Tests")
        self.test_ai_physics_chat()
        
        # Alternative target tests
        print("\n🔄 Alternative Target Tests")
        self.test_target_search("TIC 100100827")
        self.test_target_search("TRAPPIST-1")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Status {test.get('actual', 'unknown')}")
                print(f"   - {test['name']}: {error_msg}")
        
        return {
            'total_tests': self.tests_run,
            'passed_tests': self.tests_passed,
            'failed_tests': self.tests_run - self.tests_passed,
            'success_rate': self.tests_passed/self.tests_run if self.tests_run > 0 else 0,
            'failed_test_details': self.failed_tests
        }

def main():
    """Main test execution"""
    tester = ExoSeerAPITester()
    results = tester.run_comprehensive_test()
    
    # Return appropriate exit code
    return 0 if results['failed_tests'] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())