
import { useEffect, useRef, useState } from "preact/hooks";

// Types for the game state
interface Move {
    player: 1 | 2;
    row: number;
    col: number;
    orientation: "h" | "v";
}

interface GameState {
    board: (0 | 1 | 2)[][][]; // [row][col][0: h, 1: v]
    boxes: (0 | 1 | 2)[][]; // [row][col] 0: unclaimed, 1: player 1, 2: player 2
    scores: { 1: number; 2: number };
    currentPlayer: 1 | 2;
    winner?: 1 | 2 | 0;
}

const BOARD_SIZE = 8; // 4x4 dots (3x3 boxes)
const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL = `${wsProtocol}://${window.location.hostname}/ws/dots-and-boxes`;


const emptyBoard = () =>
    Array.from({ length: BOARD_SIZE - 1 }, () =>
        Array.from({ length: BOARD_SIZE - 1 }, () => [0, 0] as [0 | 1 | 2, 0 | 1 | 2])
    );
const emptyBoxes = () =>
    Array.from({ length: BOARD_SIZE - 1 }, () =>
        Array.from({ length: BOARD_SIZE - 1 }, () => 0 as 0 | 1 | 2)
    );

export const Dots_And_Boxes = () => {
        const [gameState, setGameState] = useState<GameState>({
            board: emptyBoard(),
            boxes: emptyBoxes(),
            scores: { 1: 0, 2: 0 },
            currentPlayer: 1,
        });
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = (event) => {
            try {
                const state: GameState = JSON.parse(event.data);
                setGameState(state);
            } catch (e) {
                // ignore
            }
        };
        return () => ws.close();
    }, []);

        const sendMove = (move: Move) => {
            if (wsRef.current && connected && gameState.currentPlayer === move.player) {
                wsRef.current.send(JSON.stringify(move));
            }
        };

            // Render the board with dots, lines, and boxes (with ownership and player switching)
            return (
                <div className="max-w-lg mx-auto mt-8 p-4 bg-white rounded shadow">
                    <h2 className="text-xl font-bold mb-2">Dots and Boxes</h2>
                    <div className="mb-2">Player 1: {gameState.scores[1]} | Player 2: {gameState.scores[2]}</div>
                    <div className="mb-2">Current Player: <span className={gameState.currentPlayer === 1 ? 'text-blue-700' : 'text-green-700'}>Player {gameState.currentPlayer}</span></div>
                    <div className="inline-block">
                        <table className="border-spacing-0 select-none">
                            <tbody>
                                {Array.from({ length: BOARD_SIZE }).map((_, row) => (
                                    <tr key={row}>
                                        {Array.from({ length: BOARD_SIZE }).map((_, col) => (
                                            <td key={col} style={{ padding: 0 }}>
                                                {/* Dot */}
                                                <div className="w-3 h-3 bg-black rounded-full inline-block align-middle" />
                                                {/* Horizontal line (except last col) */}
                                                {col < BOARD_SIZE - 1 && row < BOARD_SIZE && (
                                                    <button
                                                        className={`inline-block align-middle w-10 h-2 mx-1 rounded transition-colors
                                                            ${((gameState.board[row] && gameState.board[row][col]) ? gameState.board[row][col][0] : 0) === 0 ? 'bg-gray-200 hover:bg-blue-300' :
                                                                ((gameState.board[row] && gameState.board[row][col]) ? gameState.board[row][col][0] : 0) === 1 ? 'bg-blue-600' : 'bg-green-600'}
                                                        `}
                                                        disabled={Boolean(((gameState.board[row] && gameState.board[row][col]) ? gameState.board[row][col][0] : 0) !== 0 || !connected || !!gameState.winner || gameState.currentPlayer !== (window.localStorage.getItem('player') === '2' ? 2 : 1))}
                                                        title={`Draw horizontal line at (${row},${col})`}
                                                        onClick={() => sendMove({ player: gameState.currentPlayer, row, col, orientation: "h" })}
                                                    />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {/* Render vertical lines and boxes */}
                                {Array.from({ length: BOARD_SIZE - 1 }).map((_, row) => (
                                    <tr key={`v-${row}`}> 
                                        {Array.from({ length: BOARD_SIZE }).map((_, col) => (
                                            <td key={col} style={{ padding: 0 }}>
                                                {/* Vertical line (except last row) */}
                                                {col < BOARD_SIZE && row < BOARD_SIZE - 1 && (
                                                    <button
                                                        className={`block w-2 h-10 my-1 rounded transition-colors
                                                            ${((gameState.board[row] && gameState.board[row][col]) ? gameState.board[row][col][1] : 0) === 0 ? 'bg-gray-200 hover:bg-blue-300' :
                                                                ((gameState.board[row] && gameState.board[row][col]) ? gameState.board[row][col][1] : 0) === 1 ? 'bg-blue-600' : 'bg-green-600'}
                                                        `}
                                                        disabled={Boolean(((gameState.board[row] && gameState.board[row][col]) ? gameState.board[row][col][1] : 0) !== 0 || !connected || !!gameState.winner || gameState.currentPlayer !== (window.localStorage.getItem('player') === '2' ? 2 : 1))}
                                                        title={`Draw vertical line at (${row},${col})`}
                                                        onClick={() => sendMove({ player: gameState.currentPlayer, row, col, orientation: "v" })}
                                                    />
                                                )}
                                                {/* Box (if not last col/row) */}
                                                {col < BOARD_SIZE - 1 && row < BOARD_SIZE - 1 && (
                                                    <div className={`w-10 h-10 inline-flex items-center justify-center rounded text-lg font-bold
                                                        ${((gameState.boxes[row] && gameState.boxes[row][col]) ? gameState.boxes[row][col] : 0) === 1 ? 'bg-blue-200 text-blue-800' :
                                                            ((gameState.boxes[row] && gameState.boxes[row][col]) ? gameState.boxes[row][col] : 0) === 2 ? 'bg-green-200 text-green-800' : ''}
                                                    `}>
                                                        {((gameState.boxes[row] && gameState.boxes[row][col]) ? gameState.boxes[row][col] : 0) === 1 ? '1' : ((gameState.boxes[row] && gameState.boxes[row][col]) ? gameState.boxes[row][col] : 0) === 2 ? '2' : ''}
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {gameState.winner && (
                        <div className="mt-4 text-xl font-bold text-center text-purple-700">
                            Winner: Player {gameState.winner}
                        </div>
                    )}
                    <div className="mt-4 text-sm text-gray-500">{connected ? "Connected" : "Disconnected"}</div>
                </div>
            );
};
