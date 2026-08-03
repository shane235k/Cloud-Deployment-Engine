const { WebSocketServer } = require("ws");
const { Client } = require("ssh2");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Server = require("../models/Server");
const { resolveSshKeyPath } = require("./serverMonitor");

const JWT_SECRET = process.env.JWT_SECRET || "uiugwdhwgyy4ugf3f98cy5c3nty394xyr9nx93";

/**
 * Initializes the WebSocket terminal server attached to the Node HTTP server.
 */
function setupTerminalWebSocket(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/terminal",
  });

  console.log("[TerminalService] WebSocket SSH terminal server initialized at /ws/terminal");

  wss.on("connection", async (ws, req) => {
    console.log(`[TerminalService] New incoming WebSocket connection from ${req.socket.remoteAddress}`);

    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const serverId = url.searchParams.get("serverId");
      const token = url.searchParams.get("token");

      console.log(`[TerminalService] Connection params: serverId=${serverId}, tokenPresent=${!!token}`);

      if (!serverId || serverId === "undefined" || !token) {
        console.warn("[TerminalService] Missing or invalid serverId / token parameter");
        ws.send("\r\n\x1b[31m[Error] serverId and token parameters are required.\x1b[0m\r\n");
        ws.close(4001, "Missing or invalid parameters");
        return;
      }

      // Verify JWT authentication
      let decoded = null;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log(`[TerminalService] Token verified successfully for user: ${decoded.username} (role: ${decoded.role})`);
      } catch (jwtErr) {
        console.error(`[TerminalService] JWT verification failed: ${jwtErr.message}`);
        ws.send(`\r\n\x1b[31m[Error] Invalid or expired authentication token: ${jwtErr.message}\x1b[0m\r\n`);
        ws.close(4003, "Invalid token");
        return;
      }

      // Enforce admin role requirement
      if (decoded.role !== "admin") {
        console.warn(`[TerminalService] Access denied: User ${decoded.username} has role '${decoded.role}', required 'admin'`);
        ws.send("\r\n\x1b[31m[Error] Terminal access is restricted to Admin accounts.\x1b[0m\r\n");
        ws.close(4003, "Forbidden");
        return;
      }

      // Fetch target server from MongoDB
      const server = await Server.findOne({ $or: [{ _id: serverId.match(/^[0-9a-fA-F]{24}$/) ? serverId : null }, { name: serverId }, { publicIp: serverId }] });
      if (!server) {
        console.error(`[TerminalService] Target server ID ${serverId} not found in MongoDB`);
        ws.send("\r\n\x1b[31m[Error] Target server not found.\x1b[0m\r\n");
        ws.close(4004, "Server not found");
        return;
      }

      console.log(`[TerminalService] Target server found: ${server.name} (${server.publicIp})`);

      // Resolve SSH Key Path
      const sshKeyPath = resolveSshKeyPath();
      console.log(`[TerminalService] Resolved SSH key path: ${sshKeyPath}`);

      if (!sshKeyPath || !fs.existsSync(sshKeyPath)) {
        console.error(`[TerminalService] SSH key file not found on backend system. Checked: ${sshKeyPath}`);
        ws.send(`\r\n\x1b[31m[Error] SSH key file not found on backend system (${sshKeyPath}).\x1b[0m\r\n`);
        ws.close(4005, "SSH key missing");
        return;
      }

      ws.send(`\r\n\x1b[34m[Connecting]\x1b[0m Initializing SSH session to \x1b[36m${server.name}\x1b[0m (\x1b[33m${server.publicIp}\x1b[0m)...\r\n`);

      const sshUser = server.sshUser || process.env.SSH_USER || "ubuntu";
      const privateKey = fs.readFileSync(sshKeyPath);

      console.log(`[TerminalService] Connecting via SSH to ${sshUser}@${server.publicIp}:22...`);
      const conn = new Client();

      conn.on("ready", () => {
        console.log(`[TerminalService] SSH connection established to ${server.name} (${server.publicIp}). Requesting shell...`);
        ws.send(`\x1b[32m[Connected]\x1b[0m SSH connection established. Opening pseudo-terminal (PTY)...\r\n\r\n`);

        conn.shell(
          {
            term: "xterm-256color",
            cols: 80,
            rows: 24,
          },
          (err, stream) => {
            if (err) {
              console.error(`[TerminalService] Failed to open SSH shell stream: ${err.message}`);
              ws.send(`\r\n\x1b[31m[Error] Failed to open SSH shell: ${err.message}\x1b[0m\r\n`);
              ws.close();
              conn.end();
              return;
            }

            console.log(`[TerminalService] SSH PTY stream opened successfully for ${server.name}`);

            // Pipe SSH stdout/stderr stream to WebSocket client
            stream.on("data", (data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(data.toString("binary"));
              }
            });

            stream.stderr?.on("data", (data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(data.toString("binary"));
              }
            });

            stream.on("close", () => {
              console.log(`[TerminalService] SSH shell stream closed for ${server.name}`);
              if (ws.readyState === ws.OPEN) {
                ws.send("\r\n\x1b[33m[Session Closed] SSH stream ended.\x1b[0m\r\n");
                ws.close();
              }
              conn.end();
            });

            // Handle incoming WebSocket messages (keystrokes / window resize events)
            ws.on("message", (message) => {
              try {
                const str = message.toString();
                if (str.startsWith("{") && str.endsWith("}")) {
                  const parsed = JSON.parse(str);
                  if (parsed.type === "resize" && parsed.cols && parsed.rows) {
                    stream.setWindow(parsed.rows, parsed.cols, 0, 0);
                    return;
                  }
                }
              } catch {
                // Not a JSON control message, pass through as terminal input
              }
              stream.write(message);
            });

            ws.on("close", () => {
              console.log(`[TerminalService] WebSocket connection closed by client for ${server.name}`);
              stream.end();
              conn.end();
            });

            ws.on("error", (wsErr) => {
              console.error(`[TerminalService] WebSocket client error for ${server.name}:`, wsErr.message);
              stream.end();
              conn.end();
            });
          }
        );
      });

      conn.on("error", (err) => {
        console.error(`[TerminalService] SSH connection error for ${server.name} (${server.publicIp}):`, err.message);
        if (ws.readyState === ws.OPEN) {
          ws.send(`\r\n\x1b[31m[SSH Connection Error] ${err.message}\x1b[0m\r\n`);
          ws.close();
        }
      });

      conn.connect({
        host: server.publicIp,
        port: 22,
        username: sshUser,
        privateKey,
        readyTimeout: 10000,
        keepaliveInterval: 10000,
      });
    } catch (err) {
      console.error("[TerminalService] Unexpected error handling WebSocket connection:", err.message);
      if (ws.readyState === ws.OPEN) {
        ws.send(`\r\n\x1b[31m[Error] Server internal error: ${err.message}\x1b[0m\r\n`);
        ws.close();
      }
    }
  });

  return wss;
}

module.exports = { setupTerminalWebSocket };
