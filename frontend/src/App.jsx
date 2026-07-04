import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, Send, LogOut, Users, Settings } from 'lucide-react';
import { encryptMessage, decryptMessage } from './encryption';

const WS_URL = 'ws://localhost:8080';

const Home = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [purpose, setPurpose] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (name && room && purpose) {
      navigate(`/chat/${room}/${name}/${encodeURIComponent(purpose)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-md border border-gray-200">
        <div className="flex justify-center mb-6">
          <div className="bg-[#D4C376] p-4 rounded-full text-white shadow-sm">
            <MessageCircle size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">SimpleChat</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Join a room to start talking</p>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#D4C376] transition-all text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Purpose of Meet</label>
            <input 
              type="text" 
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#D4C376] transition-all text-sm"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Room Name</label>
            <input 
              type="text" 
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#D4C376] transition-all text-sm"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#D4C376] hover:bg-[#c4b366] text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};

const Chat = () => {
  const { roomId, name, purpose } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stats, setStats] = useState({ onlineUsers: 1, maxCapacity: 10 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const myUserId = useRef(null);
  const ws = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({
        type: 'join',
        payload: { roomId, name, purpose: decodeURIComponent(purpose) }
      }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'join-success') {
        myUserId.current = data.payload.userId;
        setIsAdmin(data.payload.isAdmin);
        setStats(prev => ({ ...prev, maxCapacity: data.payload.maxCapacity }));
      } else if (data.type === 'error') {
        setErrorMsg(data.payload.message);
        ws.current.close();
      } else if (data.type === 'chat') {
        const decrypted = decryptMessage(data.payload.message, roomId);
        const isMe = data.payload.senderId === myUserId.current;
        setMessages(prev => [...prev, { ...data.payload, message: decrypted, isMe: isMe }]);
      } else if (data.type === 'system') {
        setMessages(prev => [...prev, { ...data.payload, isSystem: true }]);
      } else if (data.type === 'stats-update') {
        setStats(data.payload);
      } else if (data.type === 'admin-promoted') {
        setIsAdmin(true);
        setMessages(prev => [...prev, { message: 'You have been promoted to Room Admin.', isSystem: true }]);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [roomId, name, purpose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim() || errorMsg) return;
    const encrypted = encryptMessage(input, roomId);
    ws.current.send(JSON.stringify({
      type: 'chat',
      payload: { message: encrypted, roomId }
    }));
    setInput('');
  };

  const updateCapacity = (newCapacity) => {
    if (ws.current?.readyState === WebSocket.OPEN && isAdmin) {
      ws.current.send(JSON.stringify({
        type: 'set-capacity',
        payload: { roomId, capacity: newCapacity }
      }));
    }
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-sm">
          <div className="text-red-500 mb-4 flex justify-center"><Users size={48} /></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Failed</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <button onClick={() => navigate('/')} className="bg-[#D4C376] text-white px-6 py-2 rounded-lg font-semibold">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar / Dashboard */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0 shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-[#D4C376] p-2 rounded-lg text-white">
            <MessageCircle size={20} />
          </div>
          <span className="font-bold text-lg text-gray-800">SimpleChat</span>
        </div>
        
        <div className="flex-1 p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dashboard</h3>
            <div className="text-4xl font-bold text-gray-800 mb-1">{stats.onlineUsers}</div>
            <div className="text-sm text-gray-500">Users Online</div>
          </div>

          {isAdmin && (
            <div className="bg-yellow-50/50 p-4 rounded-xl border border-[#D4C376]/30">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={16} className="text-[#D4C376]" />
                <h3 className="text-sm font-bold text-gray-700">Admin Controls</h3>
              </div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Room Capacity</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  min={stats.onlineUsers}
                  max="100"
                  className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm outline-none focus:border-[#D4C376]"
                  value={stats.maxCapacity}
                  onChange={(e) => setStats(prev => ({...prev, maxCapacity: e.target.value}))}
                  onBlur={(e) => updateCapacity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && updateCapacity(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Press enter to apply changes.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div>
            <h2 className="font-bold text-gray-800">#{roomId}</h2>
            <div className="text-xs text-gray-500 mt-0.5">{decodeURIComponent(purpose)}</div>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && <span className="bg-[#D4C376]/20 text-[#b5a356] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider hidden sm:block">Admin</span>}
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{name}</span>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
          <div className="space-y-6 max-w-4xl mx-auto pb-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} ${msg.isSystem ? 'justify-center my-6' : ''}`}
              >
                {msg.isSystem ? (
                  <div className="bg-[#D4C376]/10 text-[#a39246] px-4 py-1.5 rounded-full text-xs font-semibold border border-[#D4C376]/20">
                    {msg.message}
                  </div>
                ) : (
                  <div className={`max-w-[75%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    {!msg.isMe && <span className="text-xs text-gray-500 mb-1 ml-1 font-medium">{msg.senderName}</span>}
                    <div className={`px-5 py-3 shadow-sm text-sm ${msg.isMe ? 'bg-[#D4C376] text-white rounded-2xl rounded-tr-sm' : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200'}`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 mx-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Input Form */}
        <div className="bg-white p-4 border-t border-gray-200 shrink-0">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
            <input 
              type="text" 
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-6 py-3 outline-none focus:border-[#D4C376] focus:ring-2 focus:ring-[#D4C376]/20 transition-all text-sm text-gray-800"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-[#D4C376] hover:bg-[#c4b366] text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0"
            >
              <Send size={20} className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat/:roomId/:name/:purpose" element={<Chat />} />
    </Routes>
  );
}

export default App;
