import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Shield, Send, Users, BarChart3, Lock, LogOut, MessageCircle, Zap, Activity, Database, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { encryptMessage, decryptMessage } from './encryption';

const WS_URL = 'ws://localhost:8080';

// --- Home Component ---
const Home = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [caseId, setCaseId] = useState('');
  const [category, setCategory] = useState('General Consultation');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (name && room && caseId) {
      // Pass metadata via URL or state - let's use URL for simplicity
      navigate(`/chat/${room}/${name}/${caseId}/${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-amber-50 to-orange-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900 p-12 rounded-[3rem] shadow-[0_30px_100px_rgba(251,191,36,0.2)] w-full max-w-md border border-amber-900/20"
      >
        <div className="flex justify-center mb-8">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-3xl shadow-xl shadow-orange-900/20"
          >
            <Shield size={48} className="text-white" />
          </motion.div>
        </div>
        
        <h1 className="text-3xl font-black text-center text-amber-50 mb-2 tracking-tighter uppercase">Vault Terminal</h1>
        <p className="text-amber-500/60 text-center mb-8 font-bold uppercase tracking-[0.3em] text-[9px]">Pharma-Compliance Secured</p>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="NAME" 
              className="bg-stone-800 border-b-2 border-stone-700 p-3 outline-none focus:border-amber-500 transition-all text-amber-50 font-black placeholder-stone-600 text-xs uppercase"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="CASE ID" 
              className="bg-stone-800 border-b-2 border-stone-700 p-3 outline-none focus:border-amber-500 transition-all text-amber-50 font-black placeholder-stone-600 text-xs uppercase"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
            />
          </div>

          <select 
            className="w-full bg-stone-800 border-b-2 border-stone-700 p-3 outline-none focus:border-amber-500 transition-all text-amber-50 font-black text-xs uppercase"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>General Consultation</option>
            <option>Clinical Trial Discussion</option>
            <option>Adverse Event Reporting</option>
            <option>Proprietary R&D</option>
          </select>
          
          <input 
            type="text" 
            placeholder="SECURE ROOM KEY" 
            className="w-full bg-stone-800 border-b-2 border-stone-700 p-3 outline-none focus:border-amber-500 transition-all text-amber-50 font-black placeholder-stone-600 text-xs uppercase"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />

          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black py-4 rounded-xl transition-all shadow-2xl shadow-orange-900/40 flex items-center justify-center gap-3 text-xs tracking-widest uppercase"
          >
            Authenticate Session
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Chat Component ---
const Chat = () => {
  const { roomId, name, caseId, category } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const myUserId = useRef(null);
  const ws = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        type: 'join',
        payload: { roomId, name, caseId, category }
      }));
      ws.current.send(JSON.stringify({ type: 'request-stats' }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'join-success') {
        myUserId.current = data.payload.userId;
      } else if (data.type === 'chat') {
        const decrypted = decryptMessage(data.payload.message, roomId);
        const isMe = data.payload.senderId === myUserId.current;
        setMessages(prev => [...prev, { ...data.payload, message: decrypted, isMe: isMe }]);
      } else if (data.type === 'system') {
        setMessages(prev => [...prev, { ...data.payload, isSystem: true }]);
      } else if (data.type === 'stats-update') {
        setStats(data.payload);
      }
    };

    const statsInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'request-stats' }));
      }
    }, 3000);

    return () => {
      clearInterval(statsInterval);
      ws.current.close();
    };
  }, [roomId, name]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showStats]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const encrypted = encryptMessage(input, roomId);
    ws.current.send(JSON.stringify({
      type: 'chat',
      payload: { message: encrypted, roomId }
    }));
    setInput('');
  };

  return (
    <div className="flex h-screen bg-stone-950 overflow-hidden text-amber-50">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="w-24 sm:w-80 bg-stone-900 border-r border-stone-800 flex flex-col items-center py-10"
      >
        <div className="mb-16 flex items-center gap-3 px-8">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Shield size={24} className="text-stone-950" strokeWidth={3} />
          </div>
          <span className="hidden sm:inline font-black text-2xl tracking-tighter text-amber-500">VAULT</span>
        </div>
        
        <div className="space-y-4 w-full px-6 flex-1">
          <motion.button 
            whileHover={{ x: 5 }}
            onClick={() => setShowStats(false)}
            className={`w-full flex items-center justify-center sm:justify-start gap-4 p-5 rounded-2xl transition-all font-black text-xs tracking-widest uppercase ${!showStats ? 'bg-amber-500 text-stone-950 shadow-2xl shadow-amber-900/20' : 'text-stone-500 hover:bg-stone-800 hover:text-amber-500'}`}
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">Encrypted Terminal</span>
          </motion.button>
          
          <motion.button 
            whileHover={{ x: 5 }}
            onClick={() => setShowStats(true)}
            className={`w-full flex items-center justify-center sm:justify-start gap-4 p-5 rounded-2xl transition-all font-black text-xs tracking-widest uppercase ${showStats ? 'bg-amber-500 text-stone-950 shadow-2xl shadow-amber-900/20' : 'text-stone-500 hover:bg-stone-800 hover:text-amber-500'}`}
          >
            <BarChart3 size={18} />
            <span className="hidden sm:inline">Network Analytics</span>
          </motion.button>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center sm:justify-start gap-4 p-6 text-stone-600 hover:text-orange-500 transition-all mt-auto mx-6 font-black text-xs uppercase tracking-[0.2em]"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">Terminate</span>
        </motion.button>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-stone-950">
        {/* Header */}
        <header className="h-24 bg-stone-900/40 backdrop-blur-xl border-b border-stone-800 flex items-center justify-between px-12">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.4em] mb-1">Session Protocol</span>
            <div className="flex items-center gap-4">
              <h2 className="font-black text-2xl tracking-tight text-amber-50">{roomId}</h2>
              <span className="h-4 w-[1px] bg-stone-700"></span>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Case ID</span>
                <span className="text-xs font-bold text-amber-500/80 uppercase">{caseId}</span>
              </div>
              <span className="h-4 w-[1px] bg-stone-700"></span>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Type</span>
                <span className="text-xs font-bold text-amber-500/80 uppercase">{decodeURIComponent(category)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden sm:flex items-center gap-3 px-6 py-3 bg-stone-800 rounded-2xl border border-stone-700">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
              <span className="text-xs font-black text-amber-500 tracking-widest uppercase">{name}</span>
            </div>
            <div className="flex items-center gap-3 text-stone-500">
              <Lock size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">TLS 1.3 / AES-256</span>
            </div>
          </div>
        </header>

        {/* View Switch */}
        <main className="flex-1 overflow-y-auto p-12 custom-scrollbar" ref={scrollRef}>
          <AnimatePresence mode="wait">
            {!showStats ? (
              <motion.div 
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 max-w-5xl mx-auto"
              >
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: msg.isMe ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} ${msg.isSystem ? 'justify-center my-12' : ''}`}
                  >
                    {msg.isSystem ? (
                      <div className="text-[9px] font-black border border-amber-900/30 text-amber-500/40 px-8 py-3 rounded-full uppercase tracking-[0.4em]">
                        [SYSTEM EVENT] {msg.message}
                      </div>
                    ) : (
                      <div className={`max-w-[75%]`}>
                        {!msg.isMe && <div className="text-[10px] font-black text-amber-500 mb-3 uppercase tracking-[0.2em] ml-2 opacity-60">{msg.senderName}</div>}
                        <div className={`rounded-3xl p-6 shadow-2xl transition-all ${msg.isMe ? 'bg-amber-600 text-stone-950 font-bold rounded-tr-none' : 'bg-stone-900 text-amber-50 rounded-tl-none border border-stone-800'}`}>
                          <p className="text-sm sm:text-base leading-relaxed tracking-wide">{msg.message}</p>
                          <div className={`text-[9px] mt-4 font-black tracking-widest opacity-40 ${msg.isMe ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()} // ID: {msg.senderId?.substring(0,6)}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto space-y-12"
              >
                <div className="flex items-center justify-between border-b border-stone-800 pb-10">
                  <h2 className="text-4xl font-black text-amber-500 tracking-tighter italic">VAULT BI ENGINE</h2>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Protocol Status</div>
                    <div className="text-xs font-black text-green-500 uppercase tracking-widest">Active & Secure</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  {[
                    { label: 'Active Nodes', value: stats?.activeUsers || 0, icon: Users, color: 'text-amber-500' },
                    { label: 'Msg Relay', value: stats?.totalMessages || 0, icon: Zap, color: 'text-orange-500' },
                    { label: 'Persistence', value: stats?.dataStored || '0.00KB', icon: Database, color: 'text-red-500' },
                    { label: 'Uptime', value: `${stats?.uptimeMinutes || 0}M`, icon: Activity, color: 'text-blue-400' }
                  ].map((item, i) => (
                    <div key={i} className="bg-stone-900/50 p-8 rounded-[2rem] border border-stone-800 shadow-2xl">
                      <div className="text-stone-600 text-[10px] font-black mb-4 uppercase tracking-[0.2em]">{item.label}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-black text-amber-50 tracking-tighter">{item.value}</div>
                        <item.icon size={24} className={item.color} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* INFRASTRUCTURE EVENTS */}
                    <div className="bg-stone-900 p-8 rounded-[2.5rem] border border-stone-800">
                      <div className="flex items-center gap-3 mb-8">
                        <Server size={18} className="text-amber-500" />
                        <h3 className="text-xs font-black text-amber-50 uppercase tracking-[0.3em]">Infrastructure Relay Log</h3>
                      </div>
                      <div className="space-y-4">
                        {stats?.recentEvents?.map((evt, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-stone-950/50 rounded-2xl border border-stone-800/50">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-stone-700 font-mono">#{evt.id}</span>
                              <span className="text-xs font-bold text-stone-300 tracking-tight">{evt.msg}</span>
                            </div>
                            <span className="text-[10px] font-black text-amber-500/40 font-mono">{evt.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* NEW: SQL AUDIT TRAIL */}
                    <div className="bg-stone-900 p-8 rounded-[2.5rem] border border-stone-800">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <Database size={18} className="text-orange-500" />
                          <h3 className="text-xs font-black text-amber-50 uppercase tracking-[0.3em]">Persistent Audit Trail (SQL)</h3>
                        </div>
                        <button 
                          onClick={() => {
                            const headers = "Case ID,Category,Event,User,Details,Timestamp\n";
                            const rows = stats.auditLogs.map(l => `${l.case_id},${l.category},${l.event_type},${l.user_name},${l.details},${l.timestamp}`).join("\n");
                            const blob = new Blob([headers + rows], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `audit_report_${roomId}.csv`;
                            a.click();
                          }}
                          className="bg-amber-500 text-stone-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-amber-400 transition-all"
                        >
                          Export Compliance Report
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-[10px] font-black text-stone-600 uppercase tracking-widest border-b border-stone-800">
                              <th className="pb-4">Case ID</th>
                              <th className="pb-4">Type</th>
                              <th className="pb-4">Event</th>
                              <th className="pb-4">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats?.auditLogs?.map((log, i) => (
                              <tr key={i} className="text-[11px] border-b border-stone-800/30">
                                <td className="py-4 font-bold text-amber-50/70 uppercase">{log.case_id}</td>
                                <td className="py-4 text-stone-400">{log.category}</td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 rounded text-[9px] font-black ${log.event_type === 'SESSION_JOIN' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {log.event_type}
                                  </span>
                                </td>
                                <td className="py-4 text-stone-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-stone-900 p-8 rounded-[2.5rem] border border-stone-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-8">
                          <Lock size={18} className="text-orange-500" />
                          <h3 className="text-xs font-black text-amber-50 uppercase tracking-[0.3em]">Compliance Meta</h3>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <div className="text-[10px] font-black text-stone-600 uppercase mb-1">Database Engine</div>
                            <div className="text-sm font-bold text-amber-500 font-mono">{stats?.dbType}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-stone-600 uppercase mb-1">Standard</div>
                            <div className="text-sm font-bold text-amber-500 font-mono">{stats?.encryptionStandard}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-stone-600 uppercase mb-1">Storage Usage</div>
                            <div className="text-sm font-bold text-amber-500 font-mono">{stats?.dataStored}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 rounded-[2.5rem] border border-amber-900/20">
                      <div className="text-[9px] font-black text-amber-500 uppercase leading-relaxed tracking-widest">
                        BTSA COMPLIANCE NOTE: <br/>
                        Session logs are retained for 7 years as per HIPAA/GDPR requirements. Relational database schema optimized for high-velocity transaction auditing.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Input Bar */}
        <AnimatePresence>
          {!showStats && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="p-10 bg-stone-950 border-t border-stone-800"
            >
              <div className="max-w-5xl mx-auto flex gap-6">
                <input 
                  type="text" 
                  placeholder="TRANSMIT SECURE PACKET..."
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-2xl p-6 outline-none focus:border-amber-500 transition-all text-amber-50 font-black placeholder-stone-700 tracking-widest text-xs"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <motion.button 
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  className="bg-amber-500 hover:bg-orange-500 text-stone-950 p-6 rounded-2xl transition-all shadow-2xl shadow-orange-950/40"
                >
                  <Send size={28} strokeWidth={3} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- App Component ---
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat/:roomId/:name/:caseId/:category" element={<Chat />} />
    </Routes>
  );
}

export default App;
