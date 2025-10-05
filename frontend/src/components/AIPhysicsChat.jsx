import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  MessageSquare, Send, Minimize2, Maximize2, X, 
  Brain, Zap, BookOpen, Calculator, HelpCircle,
  Lightbulb, AlertTriangle, CheckCircle2
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AIPhysicsChat = ({ isOpen, onToggle, selectedCandidate }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your NASA-level Physics AI Assistant. I can help explain exoplanet detection physics, interpret analysis results, clarify terminology, and assist with complex calculations. What would you like to explore?',
      timestamp: new Date(),
      confidence: 0.95
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Predefined physics questions for quick access
  const quickQuestions = [
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

    try {
      // Include candidate context if available
      const context = selectedCandidate ? {
        candidate_name: selectedCandidate.name,
        period: selectedCandidate.orbital_period,
        radius: selectedCandidate.radius_earth,
        transit_depth: selectedCandidate.transit_depth,
        snr: selectedCandidate.snr,
        stellar_params: {
          temperature: selectedCandidate.star_temperature,
          radius: selectedCandidate.star_radius,
          mass: selectedCandidate.star_mass
        }
      } : null;

      const response = await axios.post(`${BACKEND_URL}/api/ai-chat`, {
        message: messageText,
        context: context,
        conversation_history: messages.slice(-5) // Last 5 messages for context
      });

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.data.response || "I apologize, but I couldn't process that request. Could you please rephrase your question about exoplanet physics?",
        timestamp: new Date(),
        confidence: response.data.confidence || 0.8,
        references: response.data.references || []
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Fallback intelligent responses based on keywords
      let fallbackResponse = generateFallbackResponse(messageText);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        confidence: 0.6,
        isOffline: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (question) => {
    const q = question.toLowerCase();
    
    if (q.includes('transit') && q.includes('depth')) {
      return 'Transit depth is directly related to the planet-to-star radius ratio: δ = (Rp/R*)². For example, if Rp/R* = 0.1, the transit depth would be 1%. This assumes the planet completely transits the stellar disk (impact parameter b < 1-Rp/R*). The actual measured depth may be shallower due to limb darkening effects and instrumental noise.';
    }
    
    if (q.includes('impact parameter') || q.includes('impact')) {
      return 'Impact parameter (b) describes how centrally the planet transits across the stellar disk. b = 0 is a central transit, while b = 1 grazes the stellar limb. It\'s related to orbital inclination: b = (a/R*) × cos(i) × [(1-e²)/(1+e×sin(ω))]. Higher impact parameters result in shorter, shallower transits and can make detection more challenging.';
    }
    
    if (q.includes('limb darkening')) {
      return 'Stellar limb darkening causes the star to appear dimmer toward its edges. This affects transit light curves by making the ingress/egress appear more gradual and can reduce the apparent transit depth by ~10-20%. We model this using quadratic laws: I(μ)/I(0) = 1 - u₁(1-μ) - u₂(1-μ)², where μ = cos(θ) and θ is the angle from disk center.';
    }
    
    if (q.includes('chi') || q.includes('fit') || q.includes('residual')) {
      return 'χ²/DoF (reduced chi-squared) measures goodness of fit. Values near 1.0 indicate good fits, while χ²/DoF >> 1 suggests systematic errors or poor models. χ²/DoF << 1 may indicate overestimated uncertainties. Residuals should be normally distributed and show no systematic trends if the model is correct.';
    }
    
    if (q.includes('false positive') || q.includes('fp')) {
      return 'Common false positive scenarios include: (1) Eclipsing binaries (EB) - check for secondary eclipses and ellipsoidal variations, (2) Background EBs - look for centroid motion during transit, (3) Stellar activity - check for correlation with stellar rotation, (4) Instrumental effects - verify across different instruments/sectors.';
    }
    
    if (q.includes('validation') || q.includes('confirmation')) {
      return 'Validation uses statistical methods to show a signal is likely planetary (>99% confidence), while confirmation requires independent measurements (usually radial velocity) to determine the object\'s mass. TESS candidates typically undergo validation first through vetting metrics, centroid analysis, and statistical validation.';
    }
    
    if (selectedCandidate) {
      return `For ${selectedCandidate.name}: I don't have a specific answer to your question, but I can tell you this candidate has a period of ${selectedCandidate.orbital_period?.toFixed(3)} days, radius of ${selectedCandidate.radius_earth?.toFixed(2)} R⊕, and transit depth of ${(selectedCandidate.transit_depth * 100)?.toFixed(4)}%. What specific aspect would you like me to explain?`;
    }
    
    return 'I apologize, but I don\'t have a specific answer for that question in offline mode. However, I can help explain transit physics, detection methods, data analysis techniques, and validation procedures. Could you please ask about a specific physics concept or analysis method?';
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
              <CardTitle className="text-sm text-white">Physics AI Assistant</CardTitle>
              <p className="text-xs exoseer-subtitle">NASA-Level Exoplanet Analysis Support</p>
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
              {/* Quick Questions */}
              {messages.length === 1 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Quick Physics Topics
                  </h4>
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
              )}

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
                      </div>
                    )}
                    <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                    {message.references && message.references.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="text-xs text-gray-400 mb-1">References:</p>
                        {message.references.map((ref, idx) => (
                          <p key={idx} className="text-xs text-blue-400">{ref}</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-gray-600 p-3 rounded-lg max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-3 h-3 border border-cyan-400 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-400">Analyzing physics...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t border-cyan-400/20">
            {selectedCandidate && (
              <div className="mb-3 p-2 rounded bg-slate-800/50 border border-cyan-400/20">
                <p className="text-xs text-cyan-400 font-medium">Current Context:</p>
                <p className="text-xs text-white">{selectedCandidate.name} - {selectedCandidate.radius_earth?.toFixed(2)} R⊕</p>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask about transit physics, analysis methods..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                className="flex-1 exoseer-input text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                size="sm"
                className="exoseer-button-primary"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default AIPhysicsChat;