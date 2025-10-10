const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const SECRET = "super-demo-secret";

app.use(cors());
app.use(express.json());

let sessions = new Map();
// interviewer creates session
app.get("/", (req, res) => {
  res.send("hello from server")
})
app.post('/sessions', (req, res) => {
  let roomId = uuidv4();
  roomId = roomId.slice(0, 6);
  sessions.set(roomId, { active: true, createdAt: Date.now(), role: req.body?.role, name: req?.body?.name });
  console.log(sessions)
  res.json({ roomId });
});

// candidate joins
// candidate joins
app.post('/join', (req, res) => {
  const { roomId } = req.body;
  const session = sessions.get(roomId);

  if (!session || !session.active) {
    return res.status(400).json({ success: false, error: "Invalid room" });
  }

  // Include name in token (optional, but handy)
  const token = jwt.sign({ role: session.role, roomId, name: session.name }, SECRET, { expiresIn: "30m" });
  res.json({ success: true, token, roomId, name: session.name, role: session.role });
});

// verify session
app.get('/session/:roomId', (req, res) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!token) return res.status(401).json({ valid: false });

  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.roomId !== req.params.roomId) {
      return res.status(401).json({ valid: false });
    }
    // Do NOT reference undefined `candidate`
    return res.json({
      valid: true,
      candidate: { role: decoded.role, name: decoded.name || null }
    });
  } catch {
    return res.status(401).json({ valid: false });
  }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
