import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';

// --- Audio Helper Functions ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component ---

interface VoiceMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodName: string;
}

interface LiveVoiceProps {
  onClose: () => void;
  onAddFood: (macros: VoiceMacros) => void;
}

const draftLogTool: FunctionDeclaration = {
  name: 'draftFoodLog',
  description: 'Call this function when the user wants to log a food or asks about nutritional info for a specific item to prepare it for logging.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      foodName: { type: Type.STRING, description: "The name of the food item" },
      calories: { type: Type.NUMBER, description: "Total calories" },
      protein: { type: Type.NUMBER, description: "Grams of protein" },
      fat: { type: Type.NUMBER, description: "Grams of fat" },
      carbs: { type: Type.NUMBER, description: "Grams of carbs" },
    },
    required: ['foodName', 'calories', 'protein', 'fat', 'carbs']
  }
};

const LiveVoice: React.FC<LiveVoiceProps> = ({ onClose, onAddFood }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [isTalking, setIsTalking] = useState(false);
  const [voiceMacros, setVoiceMacros] = useState<VoiceMacros | null>(null);
  
  // Refs for cleanup
  const cleanupRef = useRef<() => void>(() => {});
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let isMounted = true;
    let session: any = null;
    let stream: MediaStream | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let inputSource: MediaStreamAudioSourceNode | null = null;
    
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Setup Audio Contexts
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputAudioContext;

        const outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);
        
        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();

        // 2. Get Microphone Stream
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // 3. Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: "You are a friendly, concise nutrition expert for the MacroCount app. When a user tells you what they ate, estimate the macros and IMMEDIATELY call the `draftFoodLog` function with the details. Do not just speak the macros, always use the tool to draft the log. Keep spoken responses short.",
            tools: [{ functionDeclarations: [draftLogTool] }],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
          callbacks: {
            onopen: () => {
              if (!isMounted) return;
              setStatus('connected');
              
              inputSource = inputAudioContext.createMediaStreamSource(stream!);
              scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                if (!isMounted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                
                sessionPromise.then((s) => {
                   s.sendRealtimeInput({ media: pcmBlob });
                });
              };

              inputSource.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (!isMounted) return;

              // Handle Tool Calls (Structured Data)
              if (message.toolCall) {
                const calls = message.toolCall.functionCalls;
                if (calls && calls.length > 0) {
                    const call = calls[0];
                    if (call.name === 'draftFoodLog') {
                        const args = call.args as unknown as VoiceMacros;
                        setVoiceMacros(args);
                        
                        // Send simple success response to keep session alive
                        sessionPromise.then((s) => {
                            s.sendToolResponse({
                                functionResponses: {
                                    id: call.id,
                                    name: call.name,
                                    response: { result: 'OK' }
                                }
                            });
                        });
                    }
                }
              }

              // Handle Audio Output
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                setIsTalking(true);
                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                
                const audioBuffer = await decodeAudioData(
                  decode(base64Audio),
                  outputAudioContext,
                  24000,
                  1
                );
                
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => {
                   sources.delete(source);
                   if (sources.size === 0) setIsTalking(false);
                });
                
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
                sources.add(source);
              }

              // Handle Interruption
              if (message.serverContent?.interrupted) {
                sources.forEach(s => {
                    try { s.stop(); } catch(e){}
                });
                sources.clear();
                nextStartTime = 0;
                setIsTalking(false);
              }
            },
            onclose: () => {
                console.log("Session closed");
            },
            onerror: (err) => {
              console.error("Session error:", err);
              if (isMounted) setStatus('error');
            }
          }
        });

        session = await sessionPromise;

      } catch (e) {
        console.error("Failed to start session", e);
        if (isMounted) setStatus('error');
      }
    };

    startSession();

    // Cleanup function
    cleanupRef.current = () => {
        isMounted = false;
        // Stop Mic
        if (stream) stream.getTracks().forEach(track => track.stop());
        // Stop Audio Processing
        if (scriptProcessor) scriptProcessor.disconnect();
        if (inputSource) inputSource.disconnect();
        // Close Audio Context
        if (audioContextRef.current) audioContextRef.current.close();
        // Close Session
    };

    return () => {
        cleanupRef.current();
    };
  }, []);

  const handleSave = () => {
    if (voiceMacros) {
        onAddFood(voiceMacros);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="bg-surface-darker w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
          
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full p-2 transition-colors">
            <span className="material-symbols-outlined">close</span>
        </button>

        <div className="p-8 flex flex-col items-center gap-6">
            
            {/* Header/Status */}
            <div className="flex items-center gap-2 mt-2">
                <div className={`size-2 rounded-full ${status === 'connected' ? 'bg-primary animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">
                    {status === 'connected' ? 'Live Nutritionist' : status === 'error' ? 'Connection Error' : 'Connecting...'}
                </span>
            </div>

            {/* Visualizer */}
            <div className="h-40 w-full flex items-center justify-center relative my-4">
                 {/* Ripple Effects */}
                 {status === 'connected' && (
                     <>
                        <div className={`absolute rounded-full border border-primary/20 transition-all duration-1000 ${isTalking ? 'size-64 opacity-100' : 'size-24 opacity-20'}`}></div>
                        <div className={`absolute rounded-full border border-primary/40 transition-all duration-700 ${isTalking ? 'size-48 opacity-100' : 'size-24 opacity-20'}`}></div>
                     </>
                 )}

                 {/* Center Orb */}
                 <div className={`relative z-10 size-24 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'connected' ? 'bg-primary shadow-[0_0_50px_rgba(19,236,91,0.4)]' : 'bg-slate-700'}`}>
                    <span className="material-symbols-outlined text-background-dark text-4xl">
                        {status === 'error' ? 'error' : 'graphic_eq'}
                    </span>
                 </div>
            </div>

            {/* Macro Preview Card (Only shows when data is received) */}
            {voiceMacros ? (
                <div className="w-full bg-surface-dark border border-primary/30 rounded-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
                    <p className="text-white font-bold text-center mb-2 text-lg capitalize">{voiceMacros.foodName}</p>
                    <div className="flex justify-between items-center text-center">
                        <div>
                            <span className="text-xs text-slate-400 uppercase font-bold block">Cal</span>
                            <span className="text-white font-mono font-bold">{Math.round(voiceMacros.calories)}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div>
                            <span className="text-xs text-slate-400 uppercase font-bold block">Pro</span>
                            <span className="text-primary font-mono font-bold">{Math.round(voiceMacros.protein)}g</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div>
                            <span className="text-xs text-slate-400 uppercase font-bold block">Carb</span>
                            <span className="text-yellow-400 font-mono font-bold">{Math.round(voiceMacros.carbs)}g</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div>
                            <span className="text-xs text-slate-400 uppercase font-bold block">Fat</span>
                            <span className="text-red-500 font-mono font-bold">{Math.round(voiceMacros.fat)}g</span>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-center text-slate-400 text-sm leading-relaxed max-w-xs">
                    {status === 'connected' 
                        ? "Say something like \"I ate a grilled chicken sandwich\"" 
                        : "Establishing secure connection to Gemini..."}
                </p>
            )}

            {/* Primary Action */}
            <button 
                onClick={handleSave}
                disabled={!voiceMacros}
                className={`w-full transition-all text-background-dark font-bold text-lg h-14 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(19,236,91,0.2)] ${voiceMacros ? 'bg-primary hover:bg-[#0fd650] active:scale-95 cursor-pointer' : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50 shadow-none'}`}
            >
                {voiceMacros ? 'Quick add to macros' : 'Waiting for food...'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveVoice;