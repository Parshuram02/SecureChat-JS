# 🔒 SecureChat-JS (ZS BTSA Case Study)

**SecureChat-JS** is a real-time, end-to-end encrypted messaging platform designed for high-sensitivity industries like life sciences and healthcare. This project demonstrates technical proficiency in real-time communication (WebSockets), data security (AES-256), and business intelligence (Platform Analytics).

---

## 🚀 Key Features for BTSA Role

### 1. Zero-Trust Architecture (Security)
- **Client-Side Encryption**: Messages are encrypted using **AES-256** before they ever leave the user's browser.
- **Privacy First**: The server only acts as a blind relay. It never sees the message content, ensuring compliance with strict privacy standards (like HIPAA).

### 2. Platform Intelligence (Analytics)
- **Live BI Dashboard**: A built-in management console tracks real-time platform metrics:
  - Active Session Count
  - Total Message Throughput
  - Peak User Concurrency
  - Server Uptime

### 3. Real-Time Scalability
- **WebSocket Backend**: Built with Node.js and `ws` for low-latency, bidirectional communication.
- **Stateless Persistence**: Ensures no data leaks by avoiding permanent storage of sensitive conversations.

---

## 🛠️ Tech Stack
- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Node.js, WebSockets (ws)
- **Security**: Crypto-JS (AES-256)
- **Architecture**: Single Page Application (SPA) with Routing

---

## 🔧 Installation & Setup

```bash
# 1. Install Backend Dependencies
cd backend
npm install

# 2. Start Backend (Port 8080)
npm start

# 3. Install Frontend Dependencies
cd ../frontend
npm install

# 4. Start Frontend
npm run dev
```

---

## 🎙️ Interview Talk Track (For ZS BTSA)

### Q: Why did you build this project?
**A:** "I wanted to address a common pain point in the pharma industry: secure, real-time collaboration. Field reps and researchers often need to share sensitive data that cannot be stored on third-party servers. I built SecureChat-JS to provide a **Zero-Trust** environment where data is encrypted at the source."

### Q: How did you handle data security?
**A:** "I implemented **End-to-End Encryption (E2EE)** using the AES-256 algorithm. The Room ID serves as a symmetric key. By encrypting on the client side, I ensure that even if the backend is compromised, the message content remains unreadable to an attacker."

### Q: What is the business value of the 'Stats' feature?
**A:** "As a BTSA, I know that technology must be measurable. The dashboard provides platform-level metadata (volume, concurrency, uptime) which allows administrators to monitor adoption and system health without compromising individual user privacy."

### Q: Why JavaScript over other languages?
**A:** "I chose JavaScript to ensure a fast development lifecycle and broad compatibility across the stack. For an associate role, it allows me to demonstrate my ability to bridge frontend user experience with backend data flow effectively."
