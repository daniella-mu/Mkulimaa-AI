/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Send, 
  Sprout, 
  TrendingUp, 
  MapPin, 
  Volume2, 
  VolumeX,
  Loader2,
  ChevronRight,
  Sun,
  Leaf
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { getMarketAdvice, getSpeech } from './services/geminiService';
import { cn } from './lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: "Habari mkulima! Mimi ni Mkulima AI. Naweza kukusaidia kujua bei ya soko na wakati bora wa kuuza mazao yako. Unauza nini leo? (Hello farmer! I am Mkulima AI. I can help you know market prices and the best time to sell your crops. What are you selling today?)",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('Nairobi');
  const [language, setLanguage] = useState<'English' | 'Sheng'>('Sheng');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const advice = await getMarketAdvice(input, location, language);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: advice,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      handleSpeak(advice);
    } catch (error) {
      console.error("Error getting advice:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "Samahani, kuna tatizo la kiufundi. Tafadhali hakikisha API key yako imewekwa vizuri kwenye `.env` file. (Sorry, there's a technical issue. Please ensure your API key is correctly set in the `.env` file.)",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser yako haisupport voice input.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'Sheng' ? 'sw-KE' : 'en-GB';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    try {
      const cleanText = text.replace(/[#*`]/g, '').slice(0, 500);
      const base64Audio = await getSpeech(cleanText);
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Int16Array(len / 2);
        for (let i = 0; i < len; i += 2) {
          bytes[i / 2] = (binaryString.charCodeAt(i+1) << 8) | binaryString.charCodeAt(i);
        }
        const audioBuffer = audioContext.createBuffer(1, bytes.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < bytes.length; i++) {
          channelData[i] = bytes[i] / 32768;
        }
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = language === 'Sheng' ? 'sw-KE' : 'en-GB';
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-background overflow-hidden">
      {/* Vibrant Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="glass-card sticky top-0 z-20 px-6 py-4 border-b border-primary/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="vibrant-gradient p-3 rounded-2xl shadow-xl"
            >
              <Sprout className="text-white w-8 h-8" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
                Mkulima AI
                <Badge variant="secondary" className="font-sans text-[10px] uppercase tracking-widest bg-secondary text-white">Beta</Badge>
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-[0.2em] font-bold">Market Intelligence</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-primary/10 shadow-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent border-none focus:ring-0 cursor-pointer font-bold text-primary text-sm"
              >
                <option>Nairobi</option>
                <option>Mombasa</option>
                <option>Kisumu</option>
                <option>Eldoret</option>
                <option>Nakuru</option>
              </select>
            </div>
            
            <Tabs 
              value={language} 
              onValueChange={(v) => setLanguage(v as any)}
              className="w-[180px]"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted p-1">
                <TabsTrigger value="Sheng" className="rounded-full text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Sheng</TabsTrigger>
                <TabsTrigger value="English" className="rounded-full text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white">English</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto relative px-4">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 p-6 gap-6 sticky top-24 h-[calc(100vh-120px)]">
          <Card className="rounded-[2.5rem] organic-shadow border-none overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-xs font-sans font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Market Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-sans font-medium text-muted-foreground">Active Markets</span>
                <Badge variant="outline" className="font-bold border-primary/20 text-primary">12</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-sans font-medium text-muted-foreground">Price Index</span>
                <span className="text-green-600 flex items-center gap-1 font-sans font-black">
                  <TrendingUp className="w-4 h-4" /> +4.2%
                </span>
              </div>
              <Separator className="bg-primary/5" />
              <div className="space-y-2">
                <p className="text-[10px] font-sans font-bold text-muted-foreground uppercase tracking-wider">Top Demand</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-secondary/10 text-secondary border-none hover:bg-secondary/20">Nyanya</Badge>
                  <Badge className="bg-accent/10 text-accent border-none hover:bg-accent/20">Vitunguu</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-[2.5rem] organic-shadow border-none bg-secondary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-sans font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Farmer Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="text-xs font-sans space-y-4 text-muted-foreground font-medium">
                <li className="flex gap-3">
                  <div className="bg-secondary/20 p-1 rounded-full h-fit"><ChevronRight className="w-3 h-3 text-secondary" /></div>
                  Uza asubuhi mapema kupata bei bora ya soko.
                </li>
                <li className="flex gap-3">
                  <div className="bg-secondary/20 p-1 rounded-full h-fit"><ChevronRight className="w-3 h-3 text-secondary" /></div>
                  Hakikisha mazao yako ni safi na yamepangwa vizuri.
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 md:p-8 flex flex-col gap-6 h-[calc(100vh-180px)]">
          <div className="flex flex-col gap-8 pb-40">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-[95%] sm:max-w-[85%]",
                    msg.role === 'user' ? "flex-row-reverse self-end" : "self-start"
                  )}
                >
                  <Avatar className={cn(
                    "w-10 h-10 shadow-lg border-2",
                    msg.role === 'user' ? "border-secondary" : "border-primary"
                  )}>
                    <AvatarImage src={msg.role === 'ai' ? "https://api.dicebear.com/7.x/bottts/svg?seed=Mkulima" : ""} />
                    <AvatarFallback className={msg.role === 'user' ? "bg-secondary text-white" : "bg-primary text-white"}>
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    "flex flex-col",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-6 rounded-[2.5rem] organic-shadow transition-all group relative",
                      msg.role === 'user' 
                        ? "bg-secondary text-white rounded-tr-none" 
                        : "glass-card text-foreground rounded-tl-none border-primary/10"
                    )}>
                      <div className={cn(
                        "prose prose-sm max-w-none font-sans leading-relaxed",
                        msg.role === 'user' ? "text-white/90" : "text-foreground/90"
                      )}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      
                      {msg.role === 'ai' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSpeak(msg.content)}
                          className="mt-4 h-8 text-[10px] font-black uppercase tracking-widest bg-primary/5 hover:bg-primary/10 text-primary rounded-full px-4"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3 mr-2" /> : <Volume2 className="w-3 h-3 mr-2" />}
                          {isSpeaking ? "Stop" : "Listen"}
                        </Button>
                      )}
                    </div>
                    <span className="text-[9px] font-sans font-black uppercase tracking-widest opacity-30 mt-2 px-4">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 text-primary font-sans text-sm glass-card self-start px-8 py-4 rounded-full border-primary/20 animate-pulse organic-shadow"
              >
                <div className="bg-primary/20 p-2 rounded-full"><Loader2 className="w-5 h-5 animate-spin" /></div>
                <span className="font-black tracking-widest uppercase text-[10px]">Mkulima AI is analyzing markets...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-30 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="glass-card organic-shadow rounded-[3.5rem] p-3 flex flex-col gap-3 border-primary/20"
          >
            <form 
              onSubmit={handleSend}
              className="flex items-center gap-3"
            >
              <Button 
                type="button"
                size="icon"
                onClick={startListening}
                className={cn(
                  "w-14 h-14 rounded-full transition-all shadow-xl",
                  isListening ? "bg-destructive animate-pulse" : "bg-primary hover:bg-primary/90"
                )}
              >
                <Mic className="w-6 h-6" />
              </Button>
              
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'Sheng' ? "Unauza nini leo? (e.g. Mahindi, Nyanya...)" : "What are you selling today?"}
                className="flex-1 bg-transparent border-none focus:ring-0 font-sans text-lg px-4 placeholder-muted-foreground/40 font-medium"
              />
              
              <Button 
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/90 shadow-xl disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </Button>
            </form>
            
            <div className="flex justify-center gap-3 overflow-x-auto pb-2 px-6 scrollbar-hide">
              {['Mahindi', 'Nyanya', 'Viazi', 'Sukuma Wiki', 'Vitunguu', 'Maziwa'].map(crop => (
                <Button
                  key={crop}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(crop)}
                  className="rounded-full border-primary/10 bg-white/50 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all organic-shadow h-8"
                >
                  {crop}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} hidden />
    </div>
  );
}
