import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  MessageSquare, Send, Minimize2, Maximize2, X, 
  Brain, Zap, BookOpen, Calculator, HelpCircle,
  Lightbulb, AlertTriangle, CheckCircle2, Target
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AIPhysicsChat = ({ isOpen, onToggle, selectedCandidate, userMode = 'scientist' }) => {
  const getInitialMessage = () => {
    if (userMode === 'novice') {
      return 'Hello! I\'m your friendly ExoSeer AI Assistant! 🌟 I\'m here to help you discover and understand exoplanets (planets outside our solar system). I can explain concepts in simple terms, help you interpret the data you see, and guide you through the exciting world of planet hunting. What would you like to learn about?';
    }
    return 'Hello! I\'m your NASA-level Physics AI Assistant. I can help explain exoplanet detection physics, interpret analysis results, clarify terminology, and assist with complex calculations. What would you like to explore?';
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: getInitialMessage(),
      timestamp: new Date()
      // No confidence for initial greeting
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Different questions based on user mode
  const getQuickQuestions = () => {
    if (userMode === 'novice') {
      return [
        {
          category: "🌟 Exoplanet Basics",
          questions: [
            "What are exoplanets and why are they exciting?",
            "How do we find planets around other stars?",
            "What makes a planet potentially habitable?"
          ]
        },
        {
          category: "🔍 Understanding the Data",
          questions: [
            "What is this graph showing me?",
            "How do we know this signal is really a planet?",
            "What do these numbers and measurements mean?"
          ]
        },
        {
          category: "🚀 Space Missions",
          questions: [
            "What is the Kepler space telescope?",
            "How does TESS find exoplanets?",
            "What's special about the James Webb Space Telescope?"
          ]
        }
      ];
    }
    
    // Scientist mode (existing questions)
    return [
      {
        category: "Transit Physics",
        questions: [
          "Explain transit depth and planet radius relationship",
          "Why is impact parameter important?",
          "How does stellar limb darkening affect measurements?"
        ]
      },
      {
        category: "Detection Methods", 
        questions: [
          "What's the difference between transit and RV methods?",
          "How do we validate vs. confirm exoplanets?",
          "Explain centroid motion analysis"
        ]
      },
      {
        category: "Data Analysis",
        questions: [
          "What does χ²/DoF tell us about model fits?",
          "How to interpret residuals in light curves?",
          "What are the key false positive scenarios?"
        ]
      }
    ];
  };

  const quickQuestions = getQuickQuestions();

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user', 
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingProgress(0);
    
    // Estimate time based on message complexity
    const wordCount = messageText.split(' ').length;
    const hasCandidate = !!selectedCandidate;
    const estimatedSeconds = Math.min(Math.max(wordCount * 0.5 + (hasCandidate ? 2 : 1), 3), 15);
    setEstimatedTime(estimatedSeconds);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Include comprehensive candidate context if available
      const context = selectedCandidate ? {
        candidate_name: selectedCandidate.name,
        period: selectedCandidate.orbital_period,
        radius: selectedCandidate.radius_earth,
        transit_depth: selectedCandidate.transit_depth,
        snr: selectedCandidate.snr,
        discovery_method: selectedCandidate.discovery_method,
        discovery_year: selectedCandidate.discovery_year,
        status: selectedCandidate.status,
        stellar_params: {
          temperature: selectedCandidate.star_temperature,
          radius: selectedCandidate.star_radius,
          mass: selectedCandidate.star_mass,
          host_star: selectedCandidate.host_star
        },
        orbital_params: {
          semi_major_axis: selectedCandidate.semi_major_axis,
          duration: selectedCandidate.duration
        }
      } : null;

      const response = await axios.post(`${BACKEND_URL}/api/ai-chat`, {
        message: messageText,
        context: context,
        conversation_history: messages.slice(-5) // Last 5 messages for context
      }, {
        timeout: estimatedSeconds * 1000 + 5000 // Add 5 seconds buffer
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Enhanced response processing - handle JSON responses properly
      let cleanResponse = '';
      let confidence = 0.8;
      let references = [];
      
      if (response.data) {
        let responseText = response.data.response || response.data.explanation || '';
        
        // Handle JSON responses (with or without backticks)
        if (typeof responseText === 'string') {
          // Remove markdown code block formatting if present
          let jsonText = responseText.trim();
          if (jsonText.startsWith('```json') || jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
          }
          
          // Try to parse as JSON
          if (jsonText.startsWith('{') && jsonText.endsWith('}')) {
            try {
              const parsedJson = JSON.parse(jsonText);
              // Extract explanation from JSON
              if (parsedJson.explanation) {
                cleanResponse = parsedJson.explanation;
                confidence = parsedJson.confidence || 0.8;
                references = parsedJson.references || [];
              } else if (parsedJson.message) {
                cleanResponse = parsedJson.message;
              } else {
                // If JSON doesn't have expected fields, convert to readable text
                cleanResponse = Object.entries(parsedJson)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join('\n');
              }
            } catch (e) {
              // If JSON parsing fails, treat as plain text
              console.log('JSON parsing failed, using raw text:', responseText);
              cleanResponse = responseText;
            }
          } else {
            // Not JSON, use as plain text
            cleanResponse = responseText;
          }
        } else if (typeof responseText === 'string') {
          // Direct string response
          cleanResponse = responseText;
        } else if (typeof response.data === 'object') {
          // Direct object response
          if (response.data.explanation) {
            cleanResponse = response.data.explanation;
          } else if (response.data.message) {
            cleanResponse = response.data.message;
          }
        }
        
        confidence = response.data.confidence || confidence;
        references = response.data.references || references;
      }

      // If no clean response found, use fallback with context
      if (!cleanResponse || cleanResponse.length < 10) {
        console.log('Using fallback response for:', messageText);
        cleanResponse = generateFallbackResponse(messageText);
        confidence = 0.7;
      }
      
      console.log('Final response to display:', cleanResponse);

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: cleanResponse,
        timestamp: new Date(),
        confidence: confidence,
        references: references,
        processingTime: estimatedSeconds
      };

      console.log('AI Response:', assistantMessage); // Debug log
      setMessages(prev => [...prev, assistantMessage]);
      
      // Ensure loading state is cleared
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 100);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('AI Chat error:', error);
      console.error('Full error details:', error.response?.data || error.message);
      
      // Enhanced fallback responses
      let fallbackResponse = generateFallbackResponse(messageText);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        confidence: 0.6,
        isOffline: true,
        error: error.message
      };

      console.log('Fallback Response:', errorMessage); // Debug log
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 200); // Small delay to ensure UI updates
    }
  };

  const generateFallbackResponse = (question) => {
    const q = question.toLowerCase();
    
    // Different responses based on user mode
    const isNovice = userMode === 'novice';
    
    // Generate context-aware responses when candidate is selected
    let contextInfo = '';
    if (selectedCandidate) {
      contextInfo = `\n\nFor ${selectedCandidate.name}: This ${selectedCandidate.status || 'candidate'} has a period of ${selectedCandidate.orbital_period?.toFixed(3)} days, radius of ${selectedCandidate.radius_earth?.toFixed(2)} R⊕, and transit depth of ${(selectedCandidate.transit_depth * 100)?.toFixed(4)}% around ${selectedCandidate.host_star || 'its host star'}.`;
    }
    
    if (q.includes('transit') && q.includes('depth')) {
      let response = 'Transit depth is directly related to the planet-to-star radius ratio: δ = (Rp/R*)². For example, if Rp/R* = 0.1, the transit depth would be 1%. This assumes the planet completely transits the stellar disk (impact parameter b < 1-Rp/R*). The actual measured depth may be shallower due to limb darkening effects and instrumental noise.';
      if (selectedCandidate) {
        const calculatedRatio = Math.sqrt(selectedCandidate.transit_depth);
        response += `${contextInfo} The radius ratio (Rp/R*) for this system is approximately ${calculatedRatio.toFixed(4)}.`;
      }
      return response;
    }
    
    if (q.includes('impact parameter') || q.includes('impact')) {
      let response = 'Impact parameter (b) describes how centrally the planet transits across the stellar disk. b = 0 is a central transit, while b = 1 grazes the stellar limb. It\'s related to orbital inclination: b = (a/R*) × cos(i) × [(1-e²)/(1+e×sin(ω))]. Higher impact parameters result in shorter, shallower transits and can make detection more challenging.';
      if (selectedCandidate) {
        response += `${contextInfo} The transit duration of ${selectedCandidate.duration?.toFixed(1)} hours can help estimate the impact parameter for this system.`;
      }
      return response;
    }
    
    if (q.includes('limb darkening')) {
      let response = 'Stellar limb darkening causes the star to appear dimmer toward its edges. This affects transit light curves by making the ingress/egress appear more gradual and can reduce the apparent transit depth by ~10-20%. We model this using quadratic laws: I(μ)/I(0) = 1 - u₁(1-μ) - u₂(1-μ)², where μ = cos(θ) and θ is the angle from disk center.';
      if (selectedCandidate) {
        response += `${contextInfo} For a ${selectedCandidate.star_temperature || 5778}K star like ${selectedCandidate.host_star}, limb darkening coefficients typically range from u₁~0.4-0.7 and u₂~0.1-0.3.`;
      }
      return response;
    }
    
    if (q.includes('chi') || q.includes('fit') || q.includes('residual')) {
      let response = 'χ²/DoF (reduced chi-squared) measures goodness of fit. Values near 1.0 indicate good fits, while χ²/DoF >> 1 suggests systematic errors or poor models. χ²/DoF << 1 may indicate overestimated uncertainties. Residuals should be normally distributed and show no systematic trends if the model is correct.';
      if (selectedCandidate) {
        response += `${contextInfo} With SNR of ${selectedCandidate.snr?.toFixed(1)}, we expect χ²/DoF close to 1.0 for a good transit model fit.`;
      }
      return response;
    }
    
    if (q.includes('false positive') || q.includes('fp')) {
      let response = 'Common false positive scenarios include: (1) Eclipsing binaries (EB) - check for secondary eclipses and ellipsoidal variations, (2) Background EBs - look for centroid motion during transit, (3) Stellar activity - check for correlation with stellar rotation, (4) Instrumental effects - verify across different instruments/sectors.';
      if (selectedCandidate) {
        response += `${contextInfo} As a ${selectedCandidate.status || 'candidate'} detected via ${selectedCandidate.discovery_method || 'transit'} method, it has already passed initial vetting.`;
      }
      return response;
    }
    
    if (q.includes('validation') || q.includes('confirmation')) {
      let response = 'Validation uses statistical methods to show a signal is likely planetary (>99% confidence), while confirmation requires independent measurements (usually radial velocity) to determine the object\'s mass. TESS candidates typically undergo validation first through vetting metrics, centroid analysis, and statistical validation.';
      if (selectedCandidate) {
        response += `${contextInfo} This ${selectedCandidate.status} was discovered in ${selectedCandidate.discovery_year} and represents the ${selectedCandidate.status === 'confirmed' ? 'confirmed planet' : 'validated candidate'} class.`;
      }
      return response;
    }
    
    // Handle common general questions
    if (q.includes('how') && (q.includes('work') || q.includes('function'))) {
      return 'ExoSeer uses multimodal AI to analyze exoplanet candidates through four main approaches: (1) Light curve analysis using 1D-CNN + Transformer, (2) Pixel/centroid analysis with 2D-CNN, (3) System context via MLP, and (4) Physics-informed priors. These are combined through attention-weighted fusion for final classification.';
    }
    
    if (q.includes('what is') || q.includes('explain') || q.includes('define')) {
      return 'I can explain various exoplanet concepts! Try asking about specific topics like "transit depth", "impact parameter", "limb darkening", "false positives", "radial velocity", "habitable zone", or any physics concept you\'re curious about.';
    }
    
    if (q.includes('help') || q.includes('how to use') || q.includes('tutorial')) {
      return 'ExoSeer Tutorial: (1) Search for targets using the search box, (2) Select candidates from the sidebar, (3) Analyze using the four modes: Transit Photometry, Centroid Vetting, Physics Analysis, and Validation & Uncertainty, (4) Use Interactive Parameter Exploration for detailed modeling, (5) Export results using JSON/CSV buttons.';
    }

    if (selectedCandidate) {
      return `For ${selectedCandidate.name}: I don't have a specific answer to your question, but I can tell you this candidate has a period of ${selectedCandidate.orbital_period?.toFixed(3)} days, radius of ${selectedCandidate.radius_earth?.toFixed(2)} R⊕, and transit depth of ${(selectedCandidate.transit_depth * 100)?.toFixed(4)}%. What specific aspect would you like me to explain?`;
    }
    
    return 'I can help with exoplanet analysis questions! Try asking about: transit physics, detection methods, data analysis, validation techniques, or how to use specific ExoSeer features. What would you like to know?';
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 border-cyan-400/30 bg-slate-900/95 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-cyan-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-5 h-5 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
            <div>
              <CardTitle className="text-sm text-white">
                {userMode === 'novice' ? 'ExoSeer AI Guide' : 'Physics AI Assistant'}
              </CardTitle>
              <p className="text-xs exoseer-subtitle">
                {userMode === 'novice' 
                  ? 'Your Friendly Exoplanet Discovery Companion' 
                  : 'NASA-Level Exoplanet Analysis Support'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-6 h-6 p-0"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="w-6 h-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Quick Questions - Always show but collapsible */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Quick Physics Topics
                  </h4>
                  {messages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMessages([messages[0]])}
                      className="text-xs h-6 px-2 text-cyan-400 hover:text-white"
                    >
                      Reset Chat
                    </Button>
                  )}
                </div>
                <div className={`${messages.length > 1 ? 'max-h-32 overflow-y-auto' : ''}`}>
                  {quickQuestions.map((category, idx) => (
                    <div key={idx} className="mb-3">
                      <p className="text-xs text-cyan-400 font-medium mb-1">{category.category}</p>
                      <div className="space-y-1">
                        {category.questions.map((q, qIdx) => (
                          <Button
                            key={qIdx}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickQuestion(q)}
                            className="w-full text-left text-xs p-2 h-auto justify-start text-gray-300 hover:text-white"
                          >
                            <HelpCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Messages */}
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-800 border border-gray-600'
                  }`}>
                    {message.type === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-3 h-3 text-cyan-400" />
                        <span className="text-xs text-cyan-400 font-medium">AI Assistant</span>
                        {message.confidence && (
                          <Badge 
                            className={`text-xs ${
                              message.confidence > 0.8 ? 'exoseer-badge-confirmed' : 'exoseer-badge-candidate'
                            }`}
                          >
                            {Math.round(message.confidence * 100)}%
                          </Badge>
                        )}
                        {message.isOffline && (
                          <Badge className="text-xs bg-yellow-600">
                            Offline Mode
                          </Badge>
                        )}
                        {message.processingTime && (
                          <Badge className="text-xs bg-gray-600">
                            {message.processingTime}s
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Quick Actions for AI responses */}
                    {message.type === 'assistant' && !message.isOffline && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard?.writeText(message.content)}
                          className="text-xs h-6 px-2 text-gray-400 hover:text-white"
                        >
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setInput(`Can you explain more about: "${message.content.slice(0, 50)}..."`)}
                          className="text-xs h-6 px-2 text-gray-400 hover:text-white"
                        >
                          More Details
                        </Button>
                        {selectedCandidate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setInput(`How does this relate to ${selectedCandidate.name}?`)}
                            className="text-xs h-6 px-2 text-gray-400 hover:text-white"
                          >
                            Apply to {selectedCandidate.name}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {message.references && message.references.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          References:
                        </p>
                        {message.references.map((ref, idx) => (
                          <p key={idx} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">{ref}</p>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.error && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Network Error
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-gray-600 p-3 rounded-lg max-w-[85%]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-400">Analyzing physics...</span>
                      <Badge className="text-xs bg-blue-600">
                        ~{estimatedTime}s
                      </Badge>
                    </div>
                    {loadingProgress > 0 && (
                      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                        ></div>
                      </div>
                    )}
                    {loadingProgress > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Processing: {Math.round(loadingProgress)}%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t border-cyan-400/20">
            {selectedCandidate && (
              <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 border border-cyan-400/30 shadow-lg">
                <p className="text-sm text-cyan-300 font-semibold flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4" />
                  Selected: {selectedCandidate.name}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-300">
                    <span className="text-cyan-400">Period:</span> {selectedCandidate.orbital_period?.toFixed(2)}d
                  </div>
                  <div className="text-gray-300">
                    <span className="text-cyan-400">Radius:</span> {selectedCandidate.radius_earth?.toFixed(2)} R⊕
                  </div>
                  <div className="text-gray-300">
                    <span className="text-cyan-400">Depth:</span> {(selectedCandidate.transit_depth * 100)?.toFixed(3)}%
                  </div>
                  <div className="text-gray-300">
                    <span className="text-cyan-400">Status:</span> {selectedCandidate.status || 'candidate'}
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Ask about transit physics, analysis methods... (Press Enter to send, Shift+Enter for new line)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  className="exoseer-input text-sm pr-8"
                  disabled={isLoading}
                />
                {input && !isLoading && (
                  <Button
                    onClick={() => setInput('')}
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 p-0 text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                size="sm"
                className={`exoseer-button-primary transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500' 
                    : ''
                }`}
              >
                {isLoading ? (
                  <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {/* Character count and shortcuts info */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{input.length}/500 chars</span>
              <span>Enter: Send • Shift+Enter: New line</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default AIPhysicsChat;