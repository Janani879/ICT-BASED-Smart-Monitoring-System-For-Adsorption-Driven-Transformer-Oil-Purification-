import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { WebSocket, WebSocketServer } from "ws";

const SERIAL_PATH = process.env.SERIAL_PORT || "COM3";
const SERIAL_BAUD = Number(process.env.SERIAL_BAUD || 115200);
const WS_PORT = Number(process.env.WS_PORT || 8787);

const parseEsp32Line = (line) => {
  const match = line.match(/Temperature:([\d.-]+),\s*Turbidity:([\d.-]+)/i);
  if (!match) return null;

  const temperature = Number(match[1]);
  const turbidity = Number(match[2]);

  if (!Number.isFinite(temperature) || !Number.isFinite(turbidity)) {
    return null;
  }

  return {
    temperature,
    turbidity,
    raw: line,
    timestamp: Date.now(),
  };
};

const wss = new WebSocketServer({ port: WS_PORT });
let latestReading = null;

const broadcast = (payload) => {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

wss.on("connection", (socket) => {
  socket.send(
    JSON.stringify({
      type: "status",
      connected: Boolean(latestReading),
      serialPath: SERIAL_PATH,
      baudRate: SERIAL_BAUD,
      message: `Listening on ${SERIAL_PATH} at ${SERIAL_BAUD} baud`,
    }),
  );

  if (latestReading) {
    socket.send(JSON.stringify({ type: "reading", ...latestReading }));
  }
});

const port = new SerialPort({
  path: SERIAL_PATH,
  baudRate: SERIAL_BAUD,
  autoOpen: false,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

port.on("open", () => {
  const message = `Serial bridge opened ${SERIAL_PATH} at ${SERIAL_BAUD} baud`;
  console.log(message);
  broadcast({
    type: "status",
    connected: true,
    serialPath: SERIAL_PATH,
    baudRate: SERIAL_BAUD,
    message,
  });
});

port.on("error", (error) => {
  const message = `Serial error: ${error.message}`;
  console.error(message);
  broadcast({
    type: "error",
    connected: false,
    serialPath: SERIAL_PATH,
    baudRate: SERIAL_BAUD,
    message,
  });
});

port.on("close", () => {
  const message = `Serial port ${SERIAL_PATH} closed`;
  console.log(message);
  broadcast({
    type: "status",
    connected: false,
    serialPath: SERIAL_PATH,
    baudRate: SERIAL_BAUD,
    message,
  });
});

parser.on("data", (line) => {
  const raw = String(line).trim();
  if (!raw) return;

  const reading = parseEsp32Line(raw);
  if (!reading) {
    broadcast({ type: "raw", raw, timestamp: Date.now() });
    return;
  }

  latestReading = reading;
  console.log(`${new Date(reading.timestamp).toLocaleTimeString()} ${raw}`);
  broadcast({ type: "reading", ...reading });
});

port.open((error) => {
  if (error) {
    const message = `Could not open ${SERIAL_PATH}: ${error.message}`;
    console.error(message);
    broadcast({
      type: "error",
      connected: false,
      serialPath: SERIAL_PATH,
      baudRate: SERIAL_BAUD,
      message,
    });
  }
});

console.log(`WebSocket sensor stream ready at ws://127.0.0.1:${WS_PORT}`);
