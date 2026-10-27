import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  RotateCcw,
  Globe,
  PhoneCall,
  PhoneOff,
  Radio,
  MessageSquare,
  Waves,
  AlertCircle,
  Hand,
  Calendar,
  Clock,
  User as UserIcon,
  Phone,
  CheckCircle2,
  ExternalLink,
  Building2,
  Download,
} from 'lucide-react';
import { VisiteRdv } from '../types';
import {
  googleSignIn,
  createGoogleCalendarVisitEvent,
  createSiteVisitInFirestore,
  buildGoogleCalendarTemplateUrl,
  buildGoogleCalendarIcsDataUri,
  CalendarEventItem,
} from '../services/firebaseWorkspaceService';

export interface BookingProposalData {
  nomVisiteur: string;
  telephone: string;
  date: string;
  creneau: string;
  typeVisite: 'Sur site Mansouria' | 'Visite virtuelle 3D guidée';
  lotId: string;
  confirmedEventId?: string;
  confirmedHtmlLink?: string;
  confirmedIcsUri?: string;
}

interface ChatEntry {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  language: 'darija' | 'fr';
  isLiveTranscript?: boolean;
  bookingProposal?: BookingProposalData;
}

interface DarijaAIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser?: FirebaseUser | null;
  hasOAuthToken?: boolean;
  onAuthChange?: (user: FirebaseUser | null, token: string | null) => void;
  onBookVisitSuccess?: (visit: VisiteRdv, calendarEvent?: CalendarEventItem) => void;
  defaultVisitorName?: string;
  defaultVisitorEmail?: string;
}

const FEMALE_VOICES = new Set(['Aoede', 'Kore', 'Zephyr']);

// Downsample any browser hardware sampleRate (e.g., 48000Hz or 44100Hz) to exact 16000Hz
function downsampleTo16kHz(buffer: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) {
    return buffer;
  }
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// Convert Float32Array [-1, 1] audio samples to base64 16-bit PCM little-endian
function float32ToPcm16Base64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

// Convert base64 16-bit PCM little-endian to Float32Array for 24kHz AudioContext playback
function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(len / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / 32768.0;
  }
  return float32;
}

export const DarijaAIChatbot: React.FC<DarijaAIChatbotProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  hasOAuthToken,
  onAuthChange,
  onBookVisitSuccess,
  defaultVisitorName = '',
  defaultVisitorEmail = '',
}) => {
  const [activeMode, setActiveMode] = useState<'live' | 'text'>('live');
  const [language, setLanguage] = useState<'darija' | 'fr'>('darija');
  // Default to masculine voice 'Puck' so Yassine speaks with a man's voice!
  const [voiceName, setVoiceName] = useState<string>('Puck');

  const isFemaleAdvisor = FEMALE_VOICES.has(voiceName);
  const advisorNameFr = isFemaleAdvisor ? 'Yasmine' : 'Yassine';
  const advisorNameAr = isFemaleAdvisor ? 'ياسمين' : 'ياسين';

  const [messages, setMessages] = useState<ChatEntry[]>(() => {
    const saved = localStorage.getItem('ebla_chat_history_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'msg-init-1',
        sender: 'ai',
        text: "السلام عليكم ومرحبا بيك في ودادية إقامة إبلا تو بالمنصورية (المحمدية)! أنا ياسين، المستشار العقاري ديالكم. تقدر تهضر معايا مباشرة بالصوت بالدارجة المغربية، تسولني على الشقق (R+3) والمحلات، أو تطلب مني نحجز ليك موعد زيارة ونسجلو مباشرة في Google Calendar ديالك!",
        timestamp: 'À l instant',
        language: 'darija',
      },
    ];
  });

  // Written chat state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);

  // Appointment Booking & Google Calendar State
  const [savingBookingId, setSavingBookingId] = useState<string | null>(null);
  const [bookingErrorById, setBookingErrorById] = useState<Record<string, string>>({});
  const [activeLiveBooking, setActiveLiveBooking] = useState<BookingProposalData | null>(null);

  // Multimodal Live API state
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [liveError, setLiveError] = useState<string | null>(null);
  const [micFallbackNotice, setMicFallbackNotice] = useState<string | null>(null);
  const [isMicAvailable, setIsMicAvailable] = useState<boolean>(true);
  const [liveTextPrompt, setLiveTextPrompt] = useState<string>('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [liveInputTranscript, setLiveInputTranscript] = useState('');
  const [liveOutputTranscript, setLiveOutputTranscript] = useState('');

  // Stable refs for audio & WebSocket lifecycle (prevents stale closures and accidental disconnects)
  const userWantsLiveRef = useRef<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMicMutedRef = useRef<boolean>(false);
  const isBotSpeakingRef = useRef<boolean>(false);
  const lastBotSpeechEndRef = useRef<number>(0);
  const liveInputAccRef = useRef<string>('');
  const liveOutputAccRef = useRef<string>('');

  // Jitter buffer accumulator for smooth 24kHz playback without micro-cuts
  const pendingSamplesRef = useRef<Float32Array[]>([]);
  const pendingSampleCountRef = useRef<number>(0);
  const flushTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    localStorage.setItem('ebla_chat_history_v3', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveInputTranscript, liveOutputTranscript]);

  // Flush accumulated PCM samples into a single gapless AudioBufferSourceNode
  const flushPendingAudio = useCallback(() => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const outCtx = outputAudioCtxRef.current;
    if (!outCtx || pendingSampleCountRef.current === 0) return;

    if (outCtx.state === 'suspended') {
      outCtx.resume();
    }

    const totalLength = pendingSampleCountRef.current;
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of pendingSamplesRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    pendingSamplesRef.current = [];
    pendingSampleCountRef.current = 0;

    const audioBuffer = outCtx.createBuffer(1, merged.length, 24000);
    audioBuffer.getChannelData(0).set(merged);

    const source = outCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outCtx.destination);

    const now = outCtx.currentTime;
    // If starting a fresh speech turn, add a 220ms jitter buffer cushion so network jitter never cuts audio
    let startTime = nextStartTimeRef.current;
    if (startTime < now + 0.02) {
      startTime = now + 0.22;
    }

    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.push(source);
    isBotSpeakingRef.current = true;
    setIsBotSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0 && pendingSampleCountRef.current === 0) {
        isBotSpeakingRef.current = false;
        lastBotSpeechEndRef.current = Date.now();
        setIsBotSpeaking(false);
      }
    };
  }, []);

  // Enqueue incoming 24kHz PCM chunk into jitter buffer
  const enqueueOutputPcmChunk = useCallback(
    (base64Pcm: string) => {
      const float32Data = pcm16Base64ToFloat32(base64Pcm);
      if (float32Data.length === 0) return;

      pendingSamplesRef.current.push(float32Data);
      pendingSampleCountRef.current += float32Data.length;

      // Batch at least 4800 samples (200ms at 24kHz) for ultra-smooth playback, or flush after 75ms
      if (pendingSampleCountRef.current >= 4800) {
        flushPendingAudio();
      } else if (flushTimerRef.current === null) {
        flushTimerRef.current = window.setTimeout(() => {
          flushPendingAudio();
        }, 75);
      }
    },
    [flushPendingAudio]
  );

  // Stop all currently scheduled output audio chunks (manual barge-in or hangup)
  const stopAllOutputAudio = useCallback(() => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    pendingSamplesRef.current = [];
    pendingSampleCountRef.current = 0;

    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {
        // ignore
      }
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    isBotSpeakingRef.current = false;
    lastBotSpeechEndRef.current = Date.now();
    setIsBotSpeaking(false);
  }, []);

  // Full cleanup when user explicitly ends the call or closes the modal
  const stopLiveSession = useCallback(() => {
    userWantsLiveRef.current = false;

    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    stopAllOutputAudio();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {
        // ignore
      }
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (e) {
        // ignore
      }
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.close();
      } catch (e) {
        // ignore
      }
      wsRef.current = null;
    }

    setLiveStatus('idle');
    setLiveError(null);
    setMicFallbackNotice(null);
    setIsBotSpeaking(false);
    setMicVolume(0);
    setLiveInputTranscript('');
    setLiveOutputTranscript('');
    liveInputAccRef.current = '';
    liveOutputAccRef.current = '';
  }, [stopAllOutputAudio]);

  // Only stop session on component unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, [stopLiveSession]);

  // Connect WebSocket to /api/live (supports seamless auto-reconnect without dropping mic)
  const connectWebSocket = useCallback(
    (isAutoReconnect = false) => {
      if (!userWantsLiveRef.current) return;

      if (wsRef.current) {
        try {
          wsRef.current.onclose = null;
          wsRef.current.close();
        } catch (e) {
          // ignore
        }
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/live?lang=${language}&voice=${voiceName}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ping') {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong' }));
            }
            return;
          }

          if (msg.type === 'connected' || msg.type === 'reconnected') {
            setLiveStatus('connected');
            setLiveError(null);

            // Only play greeting on initial connection, not on transparent background reconnect
            if (!isAutoReconnect && msg.type === 'connected') {
              ws.send(
                JSON.stringify({
                  text:
                    language === 'darija'
                      ? `السلام عليكم، قدم راسك بالدارجة المغربية بصفتك ${advisorNameAr} ورحب بيا في إقامة إبلا تو بالمنصورية بجملة قصيرة.`
                      : `Bonjour, présente-toi brièvement comme ${advisorNameFr}, conseiller d'Ebla Two Mansouria.`,
                })
              );
            }
          } else if (msg.type === 'audio' && msg.audio) {
            enqueueOutputPcmChunk(msg.audio);
          } else if (msg.type === 'inputTranscription' && msg.text) {
            liveInputAccRef.current += msg.text;
            setLiveInputTranscript(liveInputAccRef.current);
          } else if (msg.type === 'outputTranscription' && msg.text) {
            liveOutputAccRef.current += msg.text;
            setLiveOutputTranscript(liveOutputAccRef.current);
          } else if (msg.type === 'bookingProposal' && msg.bookingProposal) {
            const incomingProposal: BookingProposalData = {
              nomVisiteur:
                msg.bookingProposal.nomVisiteur ||
                firebaseUser?.displayName ||
                defaultVisitorName ||
                '',
              telephone: msg.bookingProposal.telephone || '',
              date:
                msg.bookingProposal.date ||
                new Date(Date.now() + 86400000).toISOString().slice(0, 10),
              creneau: msg.bookingProposal.creneau || '10:30',
              typeVisite: msg.bookingProposal.typeVisite || 'Sur site Mansouria',
              lotId: msg.bookingProposal.lotId || 'GENERAL',
            };
            setActiveLiveBooking(incomingProposal);
            const nowStr = new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            setMessages((prev) => [
              ...prev,
              {
                id: `live-booking-${Date.now()}`,
                sender: 'ai',
                text:
                  language === 'darija'
                    ? `وجدت ليك بطاقة حجز الموعد ليوم ${incomingProposal.date} مع ${incomingProposal.creneau}. راجع المعلومات واضغط على الزر باش يتسجل مباشرة في Google Calendar ديالك!`
                    : `J'ai préparé votre fiche de rendez-vous pour le ${incomingProposal.date} à ${incomingProposal.creneau}. Confirmez-la ci-dessous pour l'enregistrer dans Google Calendar.`,
                timestamp: nowStr,
                language,
                isLiveTranscript: true,
                bookingProposal: incomingProposal,
              },
            ]);
          } else if (msg.type === 'turnComplete') {
            // Flush any remaining buffered audio samples
            flushPendingAudio();

            const userSpoken = liveInputAccRef.current.trim();
            const aiSpoken = liveOutputAccRef.current.trim();
            const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            if (userSpoken || aiSpoken) {
              setMessages((prev) => {
                const next = [...prev];
                if (userSpoken) {
                  next.push({
                    id: `live-user-${Date.now()}`,
                    sender: 'user',
                    text: userSpoken,
                    timestamp: nowStr,
                    language,
                    isLiveTranscript: true,
                  });
                }
                if (aiSpoken) {
                  next.push({
                    id: `live-ai-${Date.now() + 1}`,
                    sender: 'ai',
                    text: aiSpoken,
                    timestamp: nowStr,
                    language,
                    isLiveTranscript: true,
                  });
                }
                return next;
              });
            }
            liveInputAccRef.current = '';
            liveOutputAccRef.current = '';
            setLiveInputTranscript('');
            setLiveOutputTranscript('');
          } else if (msg.type === 'error') {
            setLiveError(msg.message || 'Erreur lors de la conversation Live');
          }
        } catch (err) {
          console.error('Error parsing Live WS message:', err);
        }
      };

      ws.onclose = () => {
        // If the user did NOT click "Terminer l'Appel", auto-reconnect transparently!
        if (userWantsLiveRef.current) {
          reconnectTimerRef.current = window.setTimeout(() => {
            if (userWantsLiveRef.current) {
              connectWebSocket(true);
            }
          }, 800);
        }
      };
    },
    [
      language,
      voiceName,
      advisorNameAr,
      advisorNameFr,
      enqueueOutputPcmChunk,
      flushPendingAudio,
      firebaseUser,
      defaultVisitorName,
    ]
  );

  // Attach microphone stream to an active Live session (used on start and on manual retry)
  const attachMicrophoneStream = async (): Promise<boolean> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsMicAvailable(false);
      setIsMicMuted(true);
      setMicFallbackNotice(
        language === 'darija'
          ? 'المتصفح لا يدعم الميكروفون المباشر هنا. المكالمة خدامة: اسمع ياسين مباشرة بالصوت وراسلو بالأزرار أو الكتابة لتحت!'
          : 'Microphone non détecté dans cet aperçu. Appel vocal actif : écoutez Yassine en direct et posez vos questions ci-dessous.'
      );
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (inputAudioCtxRef.current) {
        try {
          inputAudioCtxRef.current.close();
        } catch (e) {
          // ignore
        }
      }
      const inCtx = new AudioCtx();
      inputAudioCtxRef.current = inCtx;

      const source = inCtx.createMediaStreamSource(stream);
      const processor = inCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const isEchoGuardActive =
          isBotSpeakingRef.current || Date.now() - lastBotSpeechEndRef.current < 350;

        if (isMicMutedRef.current || isEchoGuardActive) {
          setMicVolume(0);
          return;
        }

        const rawSamples = e.inputBuffer.getChannelData(0);
        const samples16k = downsampleTo16kHz(rawSamples, inCtx.sampleRate);

        let sum = 0;
        for (let i = 0; i < samples16k.length; i += 4) {
          sum += samples16k[i] * samples16k[i];
        }
        const rms = Math.sqrt(sum / (samples16k.length / 4));
        setMicVolume(Math.min(100, Math.round(rms * 400)));

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const base64Audio = float32ToPcm16Base64(samples16k);
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      source.connect(processor);
      processor.connect(inCtx.destination);

      setIsMicAvailable(true);
      setIsMicMuted(false);
      setMicFallbackNotice(null);
      return true;
    } catch (_micErr: any) {
      // Gracefully continue the Live Voice call in Speaker + Live Text/Prompt mode
      // without triggering console.error or aborting the session!
      setIsMicAvailable(false);
      setIsMicMuted(true);
      setMicFallbackNotice(
        language === 'darija'
          ? 'الميكروفون غير مفعل فالمتصفح حالياً — المكالمة الصوتية خدامة! تقدر تسمع ياسين مباشرة بالصوت وتجاوبو من الخانة لتحت أو تفعل الميكروفون (🔒 في شريط العنوان).'
          : 'Microphone non autorisé par le navigateur — Appel vocal actif en mode Écoute + Clavier Live ! Vous entendez Yassine en direct et pouvez lui répondre ci-dessous (ou autoriser le micro 🔒 dans la barre d’adresse).'
      );
      return false;
    }
  };

  // Start Multimodal Live API Bidirectional Audio Session
  const startLiveSession = async () => {
    setLiveError(null);
    setMicFallbackNotice(null);
    setLiveStatus('connecting');
    userWantsLiveRef.current = true;

    try {
      // 1. Always initialize 24kHz Output AudioContext first so advisor voice plays seamlessly
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const outCtx = new AudioCtx({ sampleRate: 24000 });
      if (outCtx.state === 'suspended') {
        await outCtx.resume();
      }
      outputAudioCtxRef.current = outCtx;
      nextStartTimeRef.current = outCtx.currentTime;

      // 2. Try to attach microphone (if blocked by browser/iframe, session still proceeds in Live Audio mode!)
      await attachMicrophoneStream();

      // 3. Connect WebSocket to server's /api/live
      connectWebSocket(false);
    } catch (err: any) {
      userWantsLiveRef.current = false;
      setLiveError(err?.message || "Erreur d'initialisation audio.");
      stopLiveSession();
      setLiveStatus('error');
    }
  };

  // Manual Interrupt button: lets user immediately stop bot speech and speak
  const handleManualInterrupt = () => {
    stopAllOutputAudio();
  };

  // Send a prompt into an active Live session
  const sendLiveVoicePrompt = (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      stopAllOutputAudio();
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: `live-user-prompt-${Date.now()}`,
          sender: 'user',
          text: trimmed,
          timestamp: nowStr,
          language,
          isLiveTranscript: true,
        },
      ]);
      wsRef.current.send(JSON.stringify({ text: trimmed }));
    }
  };

  // Play native Gemini TTS on any written message via /api/tts
  const playGeminiTTS = async (text: string, msgId: string, lang: 'darija' | 'fr') => {
    if (playingMessageId === msgId) {
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current = null;
      }
      setPlayingMessageId(null);
      return;
    }

    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
      htmlAudioRef.current = null;
    }

    setTtsLoadingId(msgId);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang, voiceName }),
      });

      const data = await response.json();
      if (!response.ok || !data.audio) {
        throw new Error(data.error || 'Erreur TTS');
      }

      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audio}`);
      htmlAudioRef.current = audio;
      setPlayingMessageId(msgId);

      audio.onended = () => {
        setPlayingMessageId(null);
        htmlAudioRef.current = null;
      };
      audio.onerror = () => {
        setPlayingMessageId(null);
        htmlAudioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('Gemini TTS playback error:', err);
      setPlayingMessageId(null);
    } finally {
      setTtsLoadingId(null);
    }
  };

  // Open an interactive Google Calendar booking card directly in chat or live mode
  const openQuickBookingCard = () => {
    const defaultBooking: BookingProposalData = {
      nomVisiteur: firebaseUser?.displayName || defaultVisitorName || '',
      telephone: '',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      creneau: '10:30',
      typeVisite: 'Sur site Mansouria',
      lotId: 'GENERAL',
    };

    if (activeMode === 'live') {
      setActiveLiveBooking(defaultBooking);
    } else {
      const aiMsg: ChatEntry = {
        id: `msg-booking-${Date.now()}`,
        sender: 'ai',
        text:
          language === 'darija'
            ? 'مرحبا بيك! عمر هاد البطاقة ديال الموعد واضغط على الزر باش نسجلو ليك مباشرة في Google Calendar ديالك :'
            : 'Avec plaisir ! Complétez cette fiche de rendez-vous et cliquez sur le bouton pour l’enregistrer directement dans votre Google Calendar :',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        language,
        bookingProposal: defaultBooking,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
  };

  // Update a field in a message's bookingProposal
  const updateMessageBookingField = (
    msgId: string,
    field: keyof BookingProposalData,
    value: string
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.bookingProposal
          ? {
              ...m,
              bookingProposal: {
                ...m.bookingProposal,
                [field]: value,
              },
            }
          : m
      )
    );
  };

  // Confirm & Save Appointment to Google Calendar + Firestore + App State
  // Works universally for ALL Gmail accounts (including iflehdriss@gmail.com and all visitors)
  // without ever failing on OAuth 403 access_denied or auth/popup-closed-by-user!
  const handleSaveBookingToGoogleCalendar = async (
    targetId: string,
    proposal: BookingProposalData,
    isFromLiveOverlay = false,
    tryOAuthPopupFirst = false
  ) => {
    const cleanName =
      proposal.nomVisiteur.trim() ||
      firebaseUser?.displayName ||
      defaultVisitorName ||
      'Visiteur Ebla Two';
    const cleanPhone = proposal.telephone.trim() || '0661000000';

    setSavingBookingId(targetId);
    setBookingErrorById((prev) => ({ ...prev, [targetId]: '' }));

    try {
      // Optional OAuth popup only if explicitly requested; if closed or 403 on test screen, continue seamlessly!
      if (tryOAuthPopupFirst && !hasOAuthToken) {
        try {
          const signInResult = await googleSignIn();
          if (onAuthChange) {
            onAuthChange(signInResult.user, signInResult.accessToken);
          }
        } catch (oauthErr) {
          console.warn('OAuth popup skipped or test-mode restricted, using universal Google Calendar link:', oauthErr);
        }
      }

      const visitParams = {
        nomVisiteur: cleanName,
        telephone: cleanPhone,
        date: proposal.date,
        creneau: proposal.creneau,
        typeVisite: proposal.typeVisite,
        lotId: proposal.lotId && proposal.lotId !== 'GENERAL' ? proposal.lotId : undefined,
      };

      // Create the event via API (if OAuth token active) or generate universal Google Calendar Template URL
      const createdEvent = await createGoogleCalendarVisitEvent(visitParams);
      const universalTemplateUrl = buildGoogleCalendarTemplateUrl(visitParams);
      const icsDataUri = buildGoogleCalendarIcsDataUri(visitParams);
      const finalCalendarLink = createdEvent.htmlLink || universalTemplateUrl;

      // Build the VisiteRdv record for app state & Firestore
      const newVisit: VisiteRdv = {
        id: `VIS-${Date.now().toString().slice(-5)}`,
        nomVisiteur: cleanName,
        telephone: cleanPhone,
        email: firebaseUser?.email || defaultVisitorEmail || 'visiteur@eblatwo.ma',
        date: proposal.date,
        creneau: proposal.creneau,
        typeVisite: proposal.typeVisite,
        statut: 'Confirmée',
        lotInteresseId:
          proposal.lotId && proposal.lotId !== 'GENERAL' ? proposal.lotId : undefined,
        conseillerAssigne: 'Yassine Berrada',
      };

      // Persist to Firestore if authenticated & notify parent App
      try {
        await createSiteVisitInFirestore(newVisit, createdEvent.id);
      } catch (fsErr) {
        console.warn('Firestore siteVisit sync note:', fsErr);
      }

      if (onBookVisitSuccess) {
        onBookVisitSuccess(newVisit, createdEvent);
      }

      // Update the booking card state with confirmed Google Calendar link & .ics download
      if (isFromLiveOverlay) {
        setActiveLiveBooking((prev) =>
          prev
            ? {
                ...prev,
                nomVisiteur: cleanName,
                telephone: cleanPhone,
                confirmedEventId: createdEvent.id,
                confirmedHtmlLink: finalCalendarLink,
                confirmedIcsUri: icsDataUri,
              }
            : null
        );
      }

      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === targetId && m.bookingProposal
            ? {
                ...m,
                bookingProposal: {
                  ...m.bookingProposal,
                  nomVisiteur: cleanName,
                  telephone: cleanPhone,
                  confirmedEventId: createdEvent.id,
                  confirmedHtmlLink: finalCalendarLink,
                  confirmedIcsUri: icsDataUri,
                },
              }
            : m
        ),
        {
          id: `msg-cal-ok-${Date.now()}`,
          sender: 'ai',
          text:
            language === 'darija'
              ? `تبارك الله! الموعد ديالك ليوم ${proposal.date} على الساعة ${proposal.creneau} باسم ${cleanName} واجد ومؤكد! اضغط على الزر الأخضر "Ajouter dans mon Google Calendar" باش يتسجل فالحين فـ Google Calendar ديالك (بأي حساب بحال iflehdriss@gmail.com بلا أي بلوك).\n(Votre rendez-vous du ${proposal.date} à ${proposal.creneau} est confirmé ! Cliquez sur le bouton vert pour l'ajouter en 1 clic dans votre Google Calendar.)`
              : `Parfait ${cleanName} ! Votre rendez-vous du ${proposal.date} à ${proposal.creneau} (${proposal.typeVisite}) est confirmé. Cliquez sur le bouton vert ci-dessous pour l'enregistrer en 1 clic dans votre Google Calendar (compatible avec tous les comptes Gmail).`,
          timestamp: new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          language,
        },
      ]);
    } catch (err: any) {
      console.error('Google Calendar booking error:', err);
      setBookingErrorById((prev) => ({
        ...prev,
        [targetId]: err?.message || "Erreur lors de la préparation du rendez-vous.",
      }));
    } finally {
      setSavingBookingId(null);
    }
  };

  // Written Chat submit handler
  const handleSendText = async (messageText?: string) => {
    const query = (messageText || input).trim();
    if (!query || loading) return;

    const userMsg: ChatEntry = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      language,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          visitorName: firebaseUser?.displayName || defaultVisitorName || '',
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply || 'مرحبا بيك في إقامة إبلا تو بالمنصورية! كيفاش نقدر نعاونك؟';

      const bookingProposal: BookingProposalData | undefined = data.bookingProposal
        ? {
            nomVisiteur:
              data.bookingProposal.nomVisiteur ||
              firebaseUser?.displayName ||
              defaultVisitorName ||
              '',
            telephone: data.bookingProposal.telephone || '',
            date:
              data.bookingProposal.date ||
              new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            creneau: data.bookingProposal.creneau || '10:30',
            typeVisite: data.bookingProposal.typeVisite || 'Sur site Mansouria',
            lotId: data.bookingProposal.lotId || 'GENERAL',
          }
        : undefined;

      const aiMsg: ChatEntry = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        language,
        bookingProposal,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickTopicsDarija = [
    {
      label: '📅 حجز موعد في Google Calendar',
      prompt: 'بغيت نحجز موعد غدا مع 10:30 باش نزور إقامة إبلا تو بالمنصورية ونسجلو في Google Calendar.',
    },
    {
      label: 'الأثمنة وطريقة الأداء',
      prompt: 'عافاك شرح ليا الأثمنة ديال الشقق في إبلا تو وكيفاش مقسم الأداء على 4 دفعات؟',
    },
    {
      label: 'فين وصلات الأشغال؟',
      prompt: 'فين وصلات الأشغال ديال البني والفينيسيون في إقامة إبلا تو بالمنصورية؟',
    },
    {
      label: 'المحلات التجارية (9)',
      prompt: 'بغيت معلومات على المحلات التجارية التسعود لي كاينين في الطابق السفلي.',
    },
  ];

  const quickTopicsFrench = [
    {
      label: '📅 Prendre RDV Google Calendar',
      prompt: 'Je souhaite prendre rendez-vous demain à 10h30 pour visiter la résidence et l’enregistrer dans Google Calendar.',
    },
    {
      label: 'Prix & 4 Tranches (0% intérêt)',
      prompt: 'Quels sont les prix des appartements R+3 et le paiement en 4 tranches ?',
    },
    {
      label: 'Avancement Chantier (72%)',
      prompt: "Où en est l'avancement des travaux et quelle est la date de livraison ?",
    },
    {
      label: '9 Magasins Commerciaux RDC',
      prompt: 'Quelles sont les surfaces et disponibilités des 9 magasins au RDC ?',
    },
  ];

  // Reusable Interactive Google Calendar Booking Card Renderer
  const renderBookingCard = (
    cardId: string,
    proposal: BookingProposalData,
    onChangeField: (field: keyof BookingProposalData, val: string) => void,
    isLiveCard = false
  ) => {
    const isSaving = savingBookingId === cardId;
    const errMsg = bookingErrorById[cardId];
    const isConfirmed = Boolean(proposal.confirmedEventId);

    return (
      <div
        className={`mt-2.5 rounded-xl border p-3 text-left transition-all ${
          isLiveCard
            ? 'bg-slate-900/95 border-amber-500/40 text-white shadow-xl'
            : 'bg-amber-50/70 border-amber-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-500/20">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold">
              {language === 'darija'
                ? 'بطاقة حجز موعد · Google Calendar'
                : 'Rendez-vous · Google Calendar'}
            </span>
          </div>
          {isConfirmed ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Confirmé
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-semibold">
              Ebla Two R+3
            </span>
          )}
        </div>

        {isConfirmed ? (
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Rendez-vous confirmé &amp; prêt pour Google Calendar !</span>
              </div>
              <p className="text-[11px] opacity-90">
                {proposal.nomVisiteur} · {proposal.date} à {proposal.creneau} ({proposal.typeVisite})
              </p>
            </div>
            {proposal.confirmedHtmlLink && (
              <a
                href={proposal.confirmedHtmlLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ajouter / Ouvrir dans mon Google Calendar (Tout compte)</span>
              </a>
            )}
            {proposal.confirmedIcsUri && (
              <a
                href={proposal.confirmedIcsUri}
                download={`RDV-Ebla-Two-${proposal.date}.ics`}
                className={`w-full py-1.5 px-3 rounded-lg border font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                  isLiveCard
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>Télécharger fichier Agenda (.ics)</span>
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-[11px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] opacity-75 mb-0.5 font-medium">
                  Nom complet (الاسم الكامل)
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Ex: Mohammed Alami"
                    value={proposal.nomVisiteur}
                    onChange={(e) => onChangeField('nomVisiteur', e.target.value)}
                    className={`w-full pl-7 pr-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isLiveCard
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] opacity-75 mb-0.5 font-medium">
                  Téléphone (رقم الهاتف)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="tel"
                    placeholder="06 61 00 00 00"
                    value={proposal.telephone}
                    onChange={(e) => onChangeField('telephone', e.target.value)}
                    className={`w-full pl-7 pr-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isLiveCard
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] opacity-75 mb-0.5 font-medium">
                  Date (تاريخ الزيارة)
                </label>
                <input
                  type="date"
                  value={proposal.date}
                  onChange={(e) => onChangeField('date', e.target.value)}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isLiveCard
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] opacity-75 mb-0.5 font-medium">
                  Heure (الساعة)
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  <select
                    value={proposal.creneau}
                    onChange={(e) => onChangeField('creneau', e.target.value)}
                    className={`w-full pl-7 pr-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isLiveCard
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="10:00">10:00</option>
                    <option value="10:30">10:30</option>
                    <option value="11:30">11:30</option>
                    <option value="14:30">14:30</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] opacity-75 mb-0.5 font-medium">
                  Type de visite
                </label>
                <select
                  value={proposal.typeVisite}
                  onChange={(e) =>
                    onChangeField(
                      'typeVisite',
                      e.target.value as BookingProposalData['typeVisite']
                    )
                  }
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isLiveCard
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Sur site Mansouria">Sur site Mansouria</option>
                  <option value="Visite virtuelle 3D guidée">Visite virtuelle 3D</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] opacity-75 mb-0.5 font-medium">
                  Lot / Intérêt
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="GENERAL, B-204..."
                    value={proposal.lotId}
                    onChange={(e) => onChangeField('lotId', e.target.value)}
                    className={`w-full pl-7 pr-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      isLiveCard
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {errMsg && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSaveBookingToGoogleCalendar(cardId, proposal, isLiveCard, false)}
              disabled={isSaving}
              className="w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isSaving
                  ? 'Enregistrement en cours...'
                  : 'Confirmer & Enregistrer dans Google Calendar'}
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[440px] max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[630px] animate-fade-in">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs relative">
            <Bot className="w-5 h-5" />
            {liveStatus === 'connected' && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 absolute -top-0.5 -right-0.5 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white">
                {advisorNameFr} ({advisorNameAr}) · Conseiller IA
              </h3>
              <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold">
                {isFemaleAdvisor ? 'Voix Femme' : 'Voix Homme'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Darija (الدارجة) &amp; FR · Prise RDV Google Calendar
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={openQuickBookingCard}
            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-md border border-amber-500/40 transition-colors flex items-center gap-1"
            title="Prendre rendez-vous et l'enregistrer dans Google Calendar"
          >
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>RDV</span>
          </button>

          <button
            onClick={() => setLanguage(language === 'darija' ? 'fr' : 'darija')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-md border border-slate-700 transition-colors flex items-center gap-1"
            title="Changer la langue principale"
          >
            <Globe className="w-3 h-3 text-amber-400" />
            <span>{language === 'darija' ? 'الدارجة' : 'FR'}</span>
          </button>

          <button
            onClick={() => {
              setMessages([]);
              setActiveLiveBooking(null);
              localStorage.removeItem('ebla_chat_history_v3');
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            title="Réinitialiser la conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              stopLiveSession();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs: Multimodal Live Audio-to-Audio vs Written Chat */}
      <div className="grid grid-cols-2 bg-slate-950 p-1.5 gap-1.5 border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveMode('live')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'live'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${liveStatus === 'connected' ? 'animate-pulse text-slate-950' : ''}`} />
          <span>مكالمة صوتية مباشرة (Live)</span>
        </button>

        <button
          onClick={() => setActiveMode('text')}
          className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'text'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>محادثة مكتوبة + حجز موعد</span>
        </button>
      </div>

      {/* MODE 1: MULTIMODAL LIVE API (BIDIRECTIONAL NATIVE AUDIO-TO-AUDIO) */}
      {activeMode === 'live' && (
        <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white overflow-y-auto">
          {/* Voice & Status Bar */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  liveStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : liveStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-medium text-slate-300">
                {liveStatus === 'connected'
                  ? isBotSpeaking
                    ? `${advisorNameFr} (${advisorNameAr}) يتحدث معك...`
                    : isMicMuted
                    ? 'الميكروفون مكتوم (Micro coupé)'
                    : 'في الاستماع المباشر (تكلم بالدارجة)'
                  : liveStatus === 'connecting'
                  ? 'جاري الاتصال الصوتي المباشر...'
                  : 'جاهز للمكالمة الصوتية بالدارجة'}
              </span>
            </div>

            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              disabled={liveStatus !== 'idle' && liveStatus !== 'error'}
              className="text-[11px] bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              title="Choisir la voix du conseiller"
            >
              <option value="Puck">ياسين (Puck · صوت رجالي واضح)</option>
              <option value="Fenrir">ياسين (Fenrir · صوت رجالي هادئ)</option>
              <option value="Charon">ياسين (Charon · صوت رجالي عميق)</option>
              <option value="Kore">ياسمين (Kore · صوت نسائي)</option>
              <option value="Aoede">ياسمين (Aoede · صوت نسائي)</option>
            </select>
          </div>

          {/* Center Interactive Audio Orb & Visualizer */}
          <div className="my-auto py-3 flex flex-col items-center text-center space-y-4">
            <div className="relative flex items-center justify-center">
              {liveStatus === 'connected' && (
                <>
                  <div
                    className={`w-32 h-32 rounded-full absolute transition-transform duration-150 ${
                      isBotSpeaking
                        ? 'bg-amber-500/25 scale-125 animate-ping'
                        : 'bg-emerald-500/15'
                    }`}
                    style={{
                      transform: !isBotSpeaking
                        ? `scale(${1 + (micVolume / 100) * 0.45})`
                        : undefined,
                    }}
                  />
                  <div
                    className={`w-28 h-28 rounded-full absolute border ${
                      isBotSpeaking
                        ? 'border-amber-400/50 scale-110'
                        : 'border-emerald-400/40'
                    }`}
                  />
                </>
              )}

              <div
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl border-2 transition-all relative z-10 ${
                  liveStatus === 'connected'
                    ? isBotSpeaking
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300 text-slate-950'
                      : 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {liveStatus === 'connected' ? (
                  isBotSpeaking ? (
                    <Waves className="w-10 h-10 animate-bounce" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )
                ) : (
                  <PhoneCall className="w-9 h-9 text-amber-400" />
                )}
              </div>
            </div>

            <div className="space-y-1 max-w-xs">
              <h4 className="text-sm font-bold text-white">
                {liveStatus === 'connected'
                  ? isBotSpeaking
                    ? `${advisorNameAr} كيجاوبك بالدارجة...`
                    : `تفضل تكلم مع ${advisorNameAr} بالدارجة أو الفرنسية`
                  : `مكالمة مباشرة مع ${advisorNameAr} (${advisorNameFr})`}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {liveStatus === 'connected'
                  ? isBotSpeaking
                    ? 'المايكروفون محمي من صدى الصوت باش مايتقطعش الكلام حتى يكمل الجواب.'
                    : 'تكلم بشكل عادي أو اطلب حجز موعد في Google Calendar وغادي يتسجل فوراً.'
                  : 'صوت رجالي طبيعي بالدارجة المغربية مع إمكانية حجز المواعيد في Google Calendar.'}
              </p>
            </div>

            {/* Button to manually interrupt while bot is speaking */}
            {liveStatus === 'connected' && isBotSpeaking && (
              <button
                onClick={handleManualInterrupt}
                className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>قاطع وتكلم الآن (Prendre la parole)</span>
              </button>
            )}

            {/* Real-time Live Transcription Box */}
            {liveStatus === 'connected' && (liveInputTranscript || liveOutputTranscript) && (
              <div className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-left space-y-1.5 max-h-28 overflow-y-auto">
                {liveInputTranscript && (
                  <div className="text-xs text-emerald-300" dir="auto">
                    <span className="font-bold">أنت : </span>
                    {liveInputTranscript}
                  </div>
                )}
                {liveOutputTranscript && (
                  <div className="text-xs text-amber-300" dir="auto">
                    <span className="font-bold">{advisorNameAr} : </span>
                    {liveOutputTranscript}
                  </div>
                )}
              </div>
            )}

            {/* Live Google Calendar Appointment Card (when triggered by voice or RDV button) */}
            {activeLiveBooking && (
              <div className="w-full">
                {renderBookingCard(
                  'live-booking-active',
                  activeLiveBooking,
                  (field, val) =>
                    setActiveLiveBooking((prev) =>
                      prev ? { ...prev, [field]: val } : null
                    ),
                  true
                )}
              </div>
            )}

            {/* Non-blocking Microphone Fallback Info Banner */}
            {micFallbackNotice && (
              <div className="w-full p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px] flex flex-col gap-2 text-left">
                <div className="flex items-start gap-2">
                  <MicOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{micFallbackNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => attachMicrophoneStream()}
                  className="self-end px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Mic className="w-3 h-3" />
                  <span>{language === 'darija' ? 'إعادة تفعيل الميكروفون' : 'Réactiver le microphone'}</span>
                </button>
              </div>
            )}

            {/* Error display if any */}
            {liveError && (
              <div className="w-full p-3 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{liveError}</span>
              </div>
            )}

            {/* Quick Voice Triggers + Live Text Input while connected */}
            {liveStatus === 'connected' && (
              <div className="w-full pt-1 space-y-2.5">
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">
                    أو اضغط لسؤال {advisorNameAr} مباشرة بالصوت :
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {(language === 'darija' ? quickTopicsDarija : quickTopicsFrench).map(
                      (item, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendLiveVoicePrompt(item.prompt)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-full text-[11px] font-medium transition-colors"
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Direct text-to-live-voice bar (works both with and without microphone!) */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!liveTextPrompt.trim()) return;
                    sendLiveVoicePrompt(liveTextPrompt);
                    setLiveTextPrompt('');
                  }}
                  className="flex items-center gap-1.5 w-full"
                >
                  <input
                    type="text"
                    value={liveTextPrompt}
                    onChange={(e) => setLiveTextPrompt(e.target.value)}
                    placeholder={
                      language === 'darija'
                        ? `اكتب سؤالك هنا وغادي يجاوبك ${advisorNameAr} بالصوت مباشرة...`
                        : `Écrivez ici pour que ${advisorNameFr} vous réponde à voix haute...`
                    }
                    className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={!liveTextPrompt.trim()}
                    className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-xl font-bold transition-colors shrink-0"
                    title="Envoyer à la voix Live"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Call Controls Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-3">
            {liveStatus !== 'connected' ? (
              <button
                onClick={startLiveSession}
                disabled={liveStatus === 'connecting'}
                className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>
                  {liveStatus === 'connecting'
                    ? 'جاري ربط الاتصال الصوتي...'
                    : `ابدأ المكالمة الصوتية مع ${advisorNameAr} (Darija Live)`}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (!isMicAvailable) {
                      attachMicrophoneStream();
                    } else {
                      setIsMicMuted(!isMicMuted);
                    }
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                    !isMicAvailable || isMicMuted
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                  }`}
                >
                  {!isMicAvailable || isMicMuted ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    {!isMicAvailable
                      ? 'تفعيل المايك'
                      : isMicMuted
                      ? 'تشغيل المايك'
                      : 'كتم المايك'}
                  </span>
                </button>

                <button
                  onClick={stopLiveSession}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>إنهاء المكالمة</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: WRITTEN CHAT + GEMINI NATIVE TTS PLAYBACK + GOOGLE CALENDAR BOOKING */}
      {activeMode === 'text' && (
        <>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[92%] ${
                    isAi ? 'mr-auto items-start' : 'ml-auto items-end'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                    <span>{isAi ? `${advisorNameFr} (${advisorNameAr})` : 'Vous'}</span>
                    {m.isLiveTranscript && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">
                        مكالمة صوتية
                      </span>
                    )}
                    <span>&middot;</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed relative group w-full ${
                      isAi
                        ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-2xs'
                        : 'bg-amber-600 text-white rounded-tr-none'
                    }`}
                  >
                    <p className="whitespace-pre-line" dir="auto">
                      {m.text}
                    </p>

                    {/* Interactive Google Calendar Booking Card if attached to this message */}
                    {isAi &&
                      m.bookingProposal &&
                      renderBookingCard(
                        m.id,
                        m.bookingProposal,
                        (field, val) => updateMessageBookingField(m.id, field, val),
                        false
                      )}

                    {isAi && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <button
                          onClick={() => playGeminiTTS(m.text, m.id, m.language)}
                          disabled={ttsLoadingId === m.id}
                          className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold disabled:opacity-50"
                        >
                          {ttsLoadingId === m.id ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                              <span>جاري تحضير الصوت...</span>
                            </>
                          ) : playingMessageId === m.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                              <span>إيقاف الصوت</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>استمع بصوت {advisorNameAr}</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {m.language}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 rounded-tl-none w-max shadow-2xs animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>{advisorNameAr} يكتب الجواب...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Questions */}
          <div className="p-2 bg-slate-100 border-t border-slate-200 shrink-0 overflow-x-auto whitespace-nowrap flex gap-1.5">
            {(language === 'darija' ? quickTopicsDarija : quickTopicsFrench).map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendText(item.prompt)}
                className="px-2.5 py-1 text-[11px] bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 rounded-full border border-slate-200 transition-colors shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Written Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setActiveMode('live')}
                className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                title="Passer en Appel Vocal Live"
              >
                <PhoneCall className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder={
                  language === 'darija'
                    ? 'اطلب حجز موعد في Google Calendar أو اسأل بالدارجة...'
                    : 'Demandez un RDV Google Calendar ou posez votre question...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
