import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function ServerTerminalModal({ server, onClose }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);
  const [connectionState, setConnectionState] = useState('CONNECTING'); // CONNECTING, CONNECTED, CLOSED, ERROR

  useEffect(() => {
    if (!server || !terminalRef.current) return;

    // Initialize Xterm.js instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#ededed',
        cursor: '#388bfd',
        selectionBackground: '#1f242c',
        black: '#000000',
        red: '#f85149',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#388bfd',
        magenta: '#a371f7',
        cyan: '#39c5cf',
        white: '#b1bac4',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Determine WebSocket endpoint
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token') || '';
    
    const host = window.location.port === '5173' ? 'localhost:5000' : window.location.host;
    const targetServerId = server.id || server._id || '';
    const wsUrl = `${protocol}//${host}/ws/terminal?serverId=${targetServerId}&token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('CONNECTED');
      // Send initial terminal dimensions to backend
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      setConnectionState('CLOSED');
      term.write('\r\n\x1b[33m[Connection Closed]\x1b[0m\r\n');
    };

    ws.onerror = (err) => {
      setConnectionState('ERROR');
      console.error('WebSocket terminal error:', err);
    };

    // Forward terminal input to WebSocket
    const onDataDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Auto-fit terminal viewport on window resize
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'resize',
              cols: xtermRef.current.cols,
              rows: xtermRef.current.rows,
            })
          );
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      onDataDisposable.dispose();
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [server]);

  if (!server) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          height: '650px',
          backgroundColor: '#000000',
          border: '1px solid #30363d',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.9)',
        }}
      >
        {/* Terminal Window Header Bar */}
        <div
          style={{
            height: '44px',
            backgroundColor: '#161b22',
            borderBottom: '1px solid #30363d',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#388bfd" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#f0f6fc' }}>
              {server.name} ({server.publicIp})
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '10px',
                textTransform: 'uppercase',
                background:
                  connectionState === 'CONNECTED'
                    ? 'rgba(46, 160, 67, 0.2)'
                    : connectionState === 'CONNECTING'
                    ? 'rgba(210, 153, 34, 0.2)'
                    : 'rgba(248, 81, 73, 0.2)',
                color:
                  connectionState === 'CONNECTED'
                    ? '#3fb950'
                    : connectionState === 'CONNECTING'
                    ? '#d29922'
                    : '#f85149',
                border: `1px solid ${
                  connectionState === 'CONNECTED'
                    ? 'rgba(46, 160, 67, 0.4)'
                    : connectionState === 'CONNECTING'
                    ? 'rgba(210, 153, 34, 0.4)'
                    : 'rgba(248, 81, 73, 0.4)'
                }`,
              }}
            >
              {connectionState}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#f0f6fc')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#8b949e')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Xterm.js Container Canvas */}
        <div
          ref={terminalRef}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#000000',
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  );
}
