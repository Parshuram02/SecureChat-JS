
# 🔒 SecureChat-JS 

**SecureChat** is a real-time, end-to-end encrypted messaging platform designed for secure enterprise communication. This project demonstrates technical proficiency in real-time communication (WebSockets), data security (AES-256), and operational intelligence (Platform Analytics).

---

## 🚀 Key Features 

### 1. Zero-Trust Architecture (Security)
- **Client-Side Encryption**: Messages are encrypted using **AES-256** before they ever leave the user's browser.
- **Privacy First**: The server only acts as a blind relay. It never sees the message content, ensuring compliance with strict privacy and security standards.

### 2. Platform Intelligence (Analytics)
- **Live Dashboard**: A built-in management console tracks real-time platform metrics:
  - Active Session Count
  - Total Message Throughput
  - Peak User Concurrency
  - Server Uptime
- **System Alerts**: Automated anomaly detection for unexpected events (e.g., high message rates, rapid reconnects).
- **Audit Trails**: Exportable CSV logs of system access and connection history.

### 3. Real-Time Scalability
- **WebSocket Backend**: Built with Node.js and `ws` for low-latency, bidirectional communication.
- **Data Persistence**: Uses an integrated SQLite database to manage analytics and session history efficiently.

---

## 🛠️ Tech Stack
- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, WebSockets (ws), SQLite3
- **Security**: Crypto-JS (AES-256)
- **Architecture**: Single Page Application (SPA) with Real-Time Data Streaming

---

## 🔧 Installation & Setup

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Start Backend Servers (HTTP/WS)
npm start

# 3. Install Frontend Dependencies
cd ../frontend
npm install

# 4. Start Frontend
npm run dev
```

---

## 💡 Technical Decisions

### Q: Why did you build this project?
**A:** "I wanted to address a common pain point in modern software: secure, real-time collaboration without relying entirely on third-party servers storing readable data. I built SecureChat to provide a **Zero-Trust** environment where data is encrypted at the source."

### Q: How did you handle data security?
**A:** "I implemented **End-to-End Encryption (E2EE)** using the AES-256 algorithm. The Room ID serves as a symmetric key. By encrypting on the client side, I ensure that even if the backend is compromised, the message content remains unreadable to an attacker."

### Q: What is the value of the analytics feature?
**A:** "Technology must be measurable. The dashboard provides platform-level metadata (volume, concurrency, uptime, access logs) which allows system administrators to monitor adoption and system health without compromising individual user privacy."

### Q: Why JavaScript across the entire stack?
**A:** "I chose JavaScript/Node.js to ensure a fast development lifecycle and seamless data serialization across the stack. It perfectly balances frontend reactivity with a lightweight, event-driven backend."
