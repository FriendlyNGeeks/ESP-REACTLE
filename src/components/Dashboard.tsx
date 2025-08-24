import React, { useEffect, useState } from 'react';

interface PlayerCounts {
  'dots-and-boxes': number;
  'battleship': number;
  'tic-tac-toe': number;
}

const initialCounts: PlayerCounts = {
  'dots-and-boxes': 0,
  'battleship': 0,
  'tic-tac-toe': 0,
};


// WebSocket URLs for each game (replace with your ESP32-S3 WebSocket endpoints)
const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
const wsUrl = `${wsProtocol}://${window.location.hostname}/ws`;
const WS_URLS = {
  'dots-and-boxes': `${wsProtocol}://${window.location.hostname}/ws/dots-and-boxes`,
  'battleship': `${wsProtocol}://${window.location.hostname}/ws/battleship`,
  // 'tic-tac-toe': `${wsProtocol}://${window.location.hostname}/ws/tic-tac-toe`,
};

export const Dashboard = () => {
  const [counts, setCounts] = useState<PlayerCounts>(initialCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    setLoading(true);
    setError(null);
    const sockets: { [key: string]: WebSocket } = {};
    let openCount = 0;

    (Object.keys(WS_URLS) as (keyof PlayerCounts)[]).forEach((game) => {
      const ws = new WebSocket(WS_URLS[game]);
      sockets[game] = ws;

      ws.onopen = () => {
        openCount++;
        if (openCount === Object.keys(WS_URLS).length) setLoading(false);
      };

      ws.onmessage = (event) => {
        try {
          // Expecting a message like: { count: 2 }
          const data = JSON.parse(event.data);
          setCounts((prev) => ({ ...prev, [game]: data.count }));
          setLoading(false); // Set loading to false when a count is received
        } catch (err) {
          setError('Invalid data from ' + game);
        }
      };

      ws.onerror = (err) => {
        setError('WebSocket error for ' + game);
      };
    });

    return () => {
      Object.values(sockets).forEach((ws) => ws.close());
    };
  }, []);

  if (loading) return <div>Loading player counts...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="player-count-tracker max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Current Player Counts</h2>
      <ul className="space-y-4">
        <li>
          <a
            href="/dots-and-boxes"
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors text-blue-800 font-semibold shadow-sm"
          >
            <span>Dots and Boxes</span>
            <span className="text-lg font-bold">{counts['dots-and-boxes']}</span>
          </a>
        </li>
        <li>
          <a
            href="/battleship"
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-green-100 hover:bg-green-200 transition-colors text-green-800 font-semibold shadow-sm"
          >
            <span>Battleship</span>
            <span className="text-lg font-bold">{counts['battleship']}</span>
          </a>
        </li>
        <li>
          <a
            href="/tic-tac-toe"
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition-colors text-yellow-800 font-semibold shadow-sm"
          >
            <span>Tic-Tac-Toe</span>
            <span className="text-lg font-bold">{counts['tic-tac-toe']}</span>
          </a>
        </li>
      </ul>
    </div>
  );
};
