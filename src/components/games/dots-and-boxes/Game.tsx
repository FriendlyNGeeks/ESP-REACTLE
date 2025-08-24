// src/Game.tsx
import { useEffect, useRef, useState } from "preact/hooks";

/** ---- Types ---- */
type Player = 1 | 2;
type PlayerOrSpectator = 0 | 1 | 2;
type EdgeOwner = 0 | 1 | 2;
type BoxOwner = 0 | 1 | 2;

interface GameState {
  board: [EdgeOwner, EdgeOwner][][];
  boxes: BoxOwner[][];
  scores: { 1: number; 2: number };
  currentPlayer: Player;
  winner?: 0 | 1 | 2;
}
type ServerMsg =
  | ({ type: "state" } & GameState & { count?: number })
  | { type: "error"; reason: string }
  | { type: "ping" }
  | any;

/** ---- Constants ---- */
const BOARD_SIZE = 8;           // must match server
const DOTS = BOARD_SIZE;
const BOXES = BOARD_SIZE - 1;

const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
const WS_HOST =
  (import.meta as any).env?.VITE_WS_HOST && (import.meta as any).env.VITE_WS_HOST.trim()
    ? (import.meta as any).env.VITE_WS_HOST.trim()
    : location.host;
const WS_URL = `${wsProtocol}://${WS_HOST}/ws/dots-and-boxes`;

/** ---- Helpers ---- */
const emptyBoard = (): [EdgeOwner, EdgeOwner][][] =>
  Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => [0, 0] as [EdgeOwner, EdgeOwner])
  );

const emptyBoxes = (): BoxOwner[][] =>
  Array.from({ length: BOXES }, () =>
    Array.from({ length: BOXES }, () => 0 as BoxOwner)
  );

/** ---- Component ---- */
export const Dots_And_Boxes = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: emptyBoard(),
    boxes: emptyBoxes(),
    scores: { 1: 0, 2: 0 },
    currentPlayer: 1,
  });

  const [player, setPlayer] = useState<PlayerOrSpectator>(() =>
    localStorage.getItem("player") === "2" ? 2 : 1
  );
  const [connected, setConnected] = useState<boolean>(false);
  const [spectators, setSpectators] = useState<number>(0);
  const [player1, setEnablePlayer1] = useState<boolean>(true);
  const [player2, setEnablePlayer2] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number>(0);
  const pingTimer = useRef<number | null>(null);

  /** ---- WS connect / reconnect ---- */
  function connect() {
    console.log("[WS] connecting to", WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] open");
      setConnected(true);
      setErrorText(null);
      retryRef.current = 0;
      try { ws.send(JSON.stringify({ type: "join", player })); } catch {}

      if (pingTimer.current) clearInterval(pingTimer.current);
      pingTimer.current = window.setInterval(() => {
        try { ws.send(JSON.stringify({ type: "ping" })); } catch {}
      }, 25000);
    };

    ws.onclose = (e) => {
      console.warn("[WS] closed", e.code, e.reason);
      setConnected(false);
      if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
      const delay = Math.min(5000, 500 * Math.pow(2, retryRef.current++));
      setTimeout(connect, delay);
    };

    ws.onerror = (e) => {
      console.error("[WS] error", e);
      setErrorText("WebSocket error");
    };

    ws.onmessage = (ev) => {
      try {
        const msg: ServerMsg = JSON.parse(ev.data);
        if (msg.type === "state") {
          const { type, count, ...state } = msg;
          setGameState(state as GameState);
          if (typeof count === "number") setSpectators(Math.max(0, count - 3)); // exclude players and dashboard
          // Enable Be 1 if !msg.players["1"], Be 2 if !msg.players["2"]
          setEnablePlayer1(!(msg as any).players || !(msg as any).players["1"]);
          setEnablePlayer2(!(msg as any).players || !(msg as any).players["2"]);
        } else if (msg.type === "error") {
          setErrorText(msg.reason || "Server error");
        }
        // when receiving a message:
        if (msg.type === "you") {
          setPlayer(msg.player as 0|1|2);         // 0 = spectator
          localStorage.setItem("player", String(msg.player));
        }
      } catch {}
    };
  }

  useEffect(() => {
    connect();
    return () => {
      if (pingTimer.current) clearInterval(pingTimer.current);
      try { wsRef.current?.close(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ---- Actions ---- */
  const choosePlayer = (p: Player) => {
    setPlayer(p);
    localStorage.setItem("player", String(p));
    try { wsRef.current?.send(JSON.stringify({ type: "join", player: p })); } catch {}
  };

  const sendMove = (row: number, col: number, orientation: "h" | "v") => {
    if (!connected || !wsRef.current) return;
    if (gameState.winner !== 0) return;
    if (gameState.currentPlayer !== player) return;
    try {
      wsRef.current.send(JSON.stringify({ player, row, col, orientation }));
      setErrorText(null);
    } catch {
      setErrorText("Failed to send move");
    }
  };

  /** ---- Rendering helpers ---- */
  const dotCell = (key: string) => (
    <td key={key} style={{ width: 22, height: 22, textAlign: "center", padding: 0 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          background: "#111",
          margin: "0 auto",
          WebkitTapHighlightColor: "transparent"
        }}
      />
    </td>
  );

  // Use Pointer Events and touch-friendly sizes
  const hEdgeCell = (r: number, c: number) => {
    const taken = gameState.board[r][c][0] as EdgeOwner;
    const clickable = !taken && connected && gameState.currentPlayer === player;
    return (
      <td key={`h-${r}-${c}`} style={{ padding: 0 }}>
        <div
          role="button"
          aria-label="Claim horizontal edge"
          onPointerDown={() => clickable && sendMove(r, c, "h")}
          style={{
            width: 44,              // bigger tap target
            height: 16,
            border: "none",
            margin: 0,
            padding: 0,
            background: taken === 0 ? "#ddd" : taken === 1 ? "#2b82ff" : "#ff7a2b",
            borderRadius: 6,
            cursor: clickable ? "pointer" : "default",
            touchAction: "manipulation", // no 300ms delay
            WebkitTapHighlightColor: "transparent",
            outline: "none"
          }}
        />
      </td>
    );
  };

  const vEdgeCell = (r: number, c: number) => {
    const taken = gameState.board[r][c][1] as EdgeOwner;
    const clickable = !taken && connected && gameState.currentPlayer === player;
    return (
      <td key={`v-${r}-${c}`} style={{ padding: 0 }}>
        <div
          role="button"
          aria-label="Claim vertical edge"
          onPointerDown={() => clickable && sendMove(r, c, "v")}
          style={{
            width: 16,
            height: 44,            // bigger tap target
            border: "none",
            margin: 0,
            padding: 0,
            background: taken === 0 ? "#ddd" : taken === 1 ? "#2b82ff" : "#ff7a2b",
            borderRadius: 6,
            cursor: clickable ? "pointer" : "default",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            outline: "none"
          }}
        />
      </td>
    );
  };

  const boxCell = (r: number, c: number) => {
    const owner = gameState.boxes[r][c] as BoxOwner;
    const bg =
      owner === 0 ? "#f7f7f7" : owner === 1 ? "rgba(43,130,255,0.25)" : "rgba(255,122,43,0.25)";
    return (
      <td
        key={`b-${r}-${c}`}
        style={{
          width: 44,
          height: 44,
          background: bg,
          borderRadius: 8,
          textAlign: "center",
          verticalAlign: "middle",
          fontSize: 12,
          color: "#444",
          userSelect: "none"
        }}
      >
        {owner ? (owner === 1 ? "P1" : "P2") : ""}
      </td>
    );
  };

  /** ---- Build the table grid ---- */
  const rows: preact.ComponentChild[] = [];
  for (let y = 0; y < DOTS * 2 - 1; y++) {
    const cells: preact.ComponentChild[] = [];
    if (y % 2 === 0) {
      const r = y / 2;
      for (let x = 0; x < DOTS * 2 - 1; x++) {
        if (x % 2 === 0) {
          cells.push(dotCell(`dot-${r}-${x / 2}`));
        } else {
          const c = (x - 1) / 2;
          cells.push(hEdgeCell(r, c));
        }
      }
    } else {
      const r = (y - 1) / 2;
      for (let x = 0; x < DOTS * 2 - 1; x++) {
        if (x % 2 === 0) {
          const c = x / 2;
          cells.push(vEdgeCell(r, c));
        } else {
          const c = (x - 1) / 2;
          cells.push(boxCell(r, c));
        }
      }
    }
    rows.push(<tr key={`row-${y}`}>{cells}</tr>);
  }

  /** ---- UI ---- */
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 12 }}>
      <h2 style={{ marginTop: 0 }}>Dots & Boxes</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          You are:&nbsp;<b>P{player}</b>
          <button onPointerDown={() => choosePlayer(1)} style={{ marginLeft: 8, padding: "6px 10px", touchAction: "manipulation" }} disabled={setEnablePlayer1 ? false : true}>
            Be P1
          </button>
          <button onPointerDown={() => choosePlayer(2)} style={{ marginLeft: 8, padding: "6px 10px", touchAction: "manipulation" }} disabled={setEnablePlayer2 ? false : true}>
            Be P2
          </button>
        </div>

        <div><b>Status:</b> {connected ? "Connected" : "Reconnecting…"}{spectators > 0 && <span>&nbsp;• Spectators: {spectators}</span>}</div>
        <div><b>Turn:</b> P{gameState.currentPlayer}</div>
        <div><b>Score:</b> P1 {gameState.scores[1]} • P2 {gameState.scores[2]}</div>
        {gameState.winner !== undefined && gameState.winner !== 0 && (<div><b>Winner:</b> P{gameState.winner}</div>)}
      </div>

      <table
        cellSpacing="8"
        style={{
          borderCollapse: "separate",
          borderSpacing: 8,
          margin: "0 auto",
          userSelect: "none",
          background: "#fafafa",
          padding: 10,
          borderRadius: 14,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          touchAction: "manipulation"
        }}
      >
        <tbody>{rows}</tbody>
      </table>

      {errorText && <div style={{ color: "#b00", marginTop: 10 }}>Error: {errorText}</div>}

      <p style={{ marginTop: 10, opacity: 0.7 }}>
        Tip: On mobile, tap edges to claim them. Completing a box grants another move.
      </p>
    </div>
  );
}
