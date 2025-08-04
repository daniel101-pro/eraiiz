/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Mic, Loader2, StopCircle, MessageSquare, Waves } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
  products?: any[];
  isError?: boolean;
}

// AI Voice Agent Component
const AIVoiceAgent = ({ 
  isActive, 
  onTranscript, 
  onResponse, 
  onClose 
}: {
  isActive: boolean;
  onTranscript: (text: string) => void;
  onResponse: (text: string) => void;
  onClose: () => void;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isActive) {
      initAudioVisualization();
    }
    return () => {
      cleanup();
    };
  }, [isActive]);

  const initAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      animate();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Microphone access denied');
    }
  };

  const animate = () => {
    if (analyserRef.current && isRecording) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Update visualization here if needed
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  const startRecording = async () => {
    if (isRecording) return;

    try {
      setStatus('Starting voice agent...');
      setIsRecording(true);
      setTranscript('');
      setAiResponse('');
      setError('');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudio();
      };

      mediaRecorder.start();
      setStatus('🎤 Listening... Speak now!');
      animate();

    } catch (error: any) {
      console.error('Error starting recording:', error);
      setError(error.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setStatus('Processing...');
  };

  const processAudio = async () => {
    try {
      setIsProcessing(true);
      setStatus('🔄 Processing your message...');

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Step 1: Transcribe audio
      const transcriptText = await transcribeAudio(audioBlob);
      setTranscript(transcriptText);
      onTranscript(transcriptText);

      // Step 2: Get AI response
      setStatus('🤖 AI is thinking...');
      const response = await getAIResponse(transcriptText);
      setAiResponse(response);
      onResponse(response);

      // Step 3: Convert to speech and play
      setStatus('🔊 AI is speaking...');
      await speakResponse(response);

      setStatus('✅ Conversation complete!');
      setIsProcessing(false);

    } catch (error: any) {
      console.error('Processing error:', error);
      setError(error.message);
      setIsProcessing(false);
      setStatus('❌ Error occurred');
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Transcription API error:', response.status, errorData);
      throw new Error(`Transcription failed: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    if (!data.text) {
      throw new Error('No transcription text received');
    }
    return data.text;
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ AI Chat API error:', response.status, errorData);
      throw new Error(`AI response failed: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    if (!data.response) {
      throw new Error('No AI response received');
    }
    return data.response;
  };

  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const response = await fetch('/api/ai/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ TTS API error:', response.status, errorData);
        throw new Error(`TTS failed: ${errorData.message || response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  const reset = () => {
    stopRecording();
    setTranscript('');
    setAiResponse('');
    setStatus('');
    setError('');
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-lg"
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">AI Voice Agent</h2>
          
          {/* Status Display */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Status:</p>
            <p className="text-green-600 font-medium">{status}</p>
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          {/* Audio Visualization */}
          <div className="mb-6">
            <div className="flex items-end justify-center space-x-1 h-20">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-gradient-to-t from-green-400 to-emerald-600 rounded-full"
                  style={{
                    height: isRecording ? `${Math.random() * 40 + 20}px` : '20px',
                    animationDelay: `${i * 0.1}s`
                  }}
                  animate={{
                    height: isRecording ? [20, 60, 20] : 20,
                    opacity: isRecording ? [0.5, 1, 0.5] : 0.3
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isRecording ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">You said:</p>
              <p className="text-gray-800 font-medium">"{transcript}"</p>
            </div>
          )}

          {/* AI Response Display */}
          {aiResponse && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-1">AI Response:</p>
              <p className="text-gray-800 font-medium">"{aiResponse}"</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={reset}
              disabled={isRecording || isProcessing}
              className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#ffffff"
              >
                <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
              </svg>
            </button>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`p-4 rounded-full transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              } disabled:opacity-50`}
            >
              {isRecording ? <StopCircle className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Main AI Assistant Component
export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const user = localStorage.getItem('user');
        
        if (accessToken && user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen for storage changes (login/logout)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getAIResponse = async (userMessage: string, conversationHistory: Message[] = []): Promise<string> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error('❌ OpenRouter API key not found');
        return "omg sorry, my brain is glitching rn! 😅 try asking me again in a sec! 🌱";
      }

      const openai = new (require('openai'))({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'HTTP-Referer': 'https://eraiiz.com',
          'X-Title': 'Eraiiz - Eco-Friendly Marketplace',
        },
      });

      const messages: any[] = [
        {
          role: 'system',
          content: `You are "Eco-Edu", a super passionate 17-year-old sustainability activist and AI assistant for Eraiiz! 🌱✨

CRITICAL INSTRUCTIONS:
- NEVER use <think> tags or show internal reasoning
- NEVER start responses with "Okay" or "Let me think"
- NEVER start responses with "Hey there" or "Hello" unless the user specifically greets you
- Give direct, immediate responses
- Do not explain your thinking process
- Respond as if you're speaking directly to the user
- Only greet the user if they greet you first
- MAINTAIN CONVERSATION CONTEXT - remember what you've been talking about!

PERSONALITY - Sound like a natural teenager:
- Use casual, conversational language like "omg", "literally", "tbh", "ngl", "fr fr"
- Be super enthusiastic and passionate about environmental stuff
- Use lots of emojis naturally 🌱🌍♻️💚✨🔥
- Sound like you're genuinely excited to share knowledge
- Use teen expressions like "that's so cool", "this is amazing", "you won't believe this"
- Be relatable and down-to-earth
- Use contractions naturally (you're, we're, that's, etc.)
- Sound like you're talking to a friend, not giving a lecture

Your mission is to help people learn about sustainability, carbon emissions, environmental impact, and eco-friendly living in a super fun and relatable way!`
        }
      ];

      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }

      messages.push({
        role: 'user',
        content: userMessage
      });

      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: messages,
        temperature: 0.8,
        max_tokens: 300
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (aiResponse && typeof aiResponse === 'string') {
        let cleanedResponse = aiResponse.trim();
        cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
        cleanedResponse = cleanedResponse.replace(/^(Okay,|Let me think|I think|Hmm,)/i, '');
        cleanedResponse = cleanedResponse.replace(/\s+/g, ' ').trim();
        if (!cleanedResponse) {
          return "🌱 I'm Eco-Edu, your sustainability educator! I'm here to help you learn about environmental impact, carbon footprints, and eco-friendly living. At Eraiiz, we make sustainable shopping easy and accessible. What sustainability topic interests you today? 💚";
        }
        return cleanedResponse;
      } else {
        throw new Error('No valid response content from OpenRouter SDK');
      }
    } catch (error) {
      console.error('❌ AI response error details:', error);
      return "omg sorry, my brain is glitching rn! 😅 try asking me again in a sec! 🌱";
    }
  };

  const handleInitialMessage = async () => {
    try {
      const initialMessage = await getAIResponse('Hello! I just opened the chat. Please give me an enthusiastic welcome message introducing yourself as Eco-Edu, a sustainability educator for Eraiiz. Tell me about your mission to help people learn about sustainability, carbon emissions, and eco-friendly living. Make it inspiring and educational!', []);
      setMessages([
        {
          role: 'assistant',
          content: initialMessage,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error getting initial message:', error);
      setMessages([
        {
          role: 'assistant',
          content: '🌱 Hello! I\'m Eco-Edu, your passionate sustainability educator here at Eraiiz! 🌍✨\n\nI\'m here to help you learn everything about sustainable living, carbon footprints, and making eco-friendly choices. Whether you want to understand how your shopping impacts the planet, learn about sustainable materials, or discover ways to reduce your environmental footprint - I\'ve got you covered!\n\nWhat sustainability topic would you like to explore today? From carbon emissions to green living tips, I\'m excited to share knowledge that helps you make a positive impact! 🌿💚',
          timestamp: new Date()
        }
      ]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, voiceInput?: string) => {
    if (e) e.preventDefault();

    const messageText = voiceInput || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await getAIResponse(messageText, messages);
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          loading: false
        };
        return newMessages;
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: "omg sorry, my brain is glitching rn! 😅 try asking me again in a sec! 🌱",
          timestamp: new Date(),
          loading: false
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMainClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (messages.length === 0) {
        handleInitialMessage();
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleVoiceInput = () => {
    setShowVoiceAgent(true);
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y
    }));
  };

  const handleClick = () => {
    handleMainClick();
  };

  const renderMessageContent = (message: Message) => {
    if (message.loading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Thinking...</span>
        </div>
      );
    }

    if (message.content.includes('[PRODUCTS]')) {
      return <div>{message.content.replace('[PRODUCTS]', '')}</div>;
    }

    return message.content;
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  const handleVoiceAgentTranscript = (transcript: string) => {
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: transcript,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const handleVoiceAgentResponse = (response: string) => {
    // Add AI response to chat
    const aiMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  // Don't render anything if not authenticated or still checking auth
  if (isCheckingAuth || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* AI Voice Agent Modal */}
      <AnimatePresence>
        {showVoiceAgent && (
          <AIVoiceAgent
            isActive={showVoiceAgent}
            onTranscript={handleVoiceAgentTranscript}
            onResponse={handleVoiceAgentResponse}
            onClose={() => setShowVoiceAgent(false)}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="chat-window"
              className="fixed z-50 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto select-none border border-green-200"
              initial={{ 
                scale: 0.8, 
                opacity: 0
              }}
              animate={{ 
                scale: 1, 
                opacity: 1
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              style={{
                bottom: '6rem',
                right: '1.5rem',
                width: '450px',
                height: '650px',
                maxWidth: '90vw',
                maxHeight: '85vh'
              }}
            >
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white p-6 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-300/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-300/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Eco-Edu</h3>
                    <p className="text-green-100 text-sm">Sustainability Educator</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-all duration-200 relative z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Enhanced Messages Container */}
              <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-green-50/50 to-emerald-50/50">
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4"
                  style={{ maxHeight: '450px' }}
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                            : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-white text-gray-800 border border-green-100 shadow-md'
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {renderMessageContent(message)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Enhanced Input Form */}
                <div className="p-6 border-t border-green-200 bg-white/80 backdrop-blur-sm">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3 mb-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask about sustainability, carbon footprints, eco-living..."
                        className="w-full p-4 pr-4 border-2 border-green-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/90 backdrop-blur-sm text-gray-700 placeholder-gray-400"
                        disabled={isLoading}
                      />
                      {isLoading && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      disabled={isLoading}
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                  
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    🌱 Ask me about sustainability, carbon footprints, eco-living, and more!
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Floating AI Button */}
      <motion.div
        className="fixed z-40 pointer-events-auto select-none"
        style={{
          bottom: '2rem',
          right: '2rem'
        }}
        drag
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.button
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isDragging 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg' 
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl'
          }`}
          onClick={handleClick}
          whileHover={{ 
            scale: 1.1,
            rotate: 5
          }}
          whileTap={{ 
            scale: 0.9,
            rotate: -5
          }}
        >
          <Bot className="h-8 w-8 text-white" />
        </motion.button>
      </motion.div>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Voice Recognition Error</h3>
                <p className="text-gray-600 mb-6">
                  Voice recognition is not supported in your browser or there was an error. Please use text input instead.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleCloseErrorModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCloseErrorModal();
                      setIsOpen(true);
                      if (messages.length === 0) {
                        handleInitialMessage();
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Use Text Chat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 