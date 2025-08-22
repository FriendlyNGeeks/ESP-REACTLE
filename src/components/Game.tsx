import { useEffect, useState, useRef } from "preact/hooks";
import { Wordle } from "./_index";
import { dictionary } from "../data/dictionary";

export const Game = () => {
    const [solution, setSolution] = useState("");
    const [words, setWords] = useState([]);
    const [wordHistory, setWordHistory] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const wsRef = useRef<WebSocket | null>(null);

    const initializeGame = () => {
        const dictWords = Object.keys(dictionary).filter(
            dict => dict.length === 5 && !wordHistory.includes(dict)
        );
        setWords(dictWords);
        const wordSize = dictWords.length;
        if (wordSize === 0) {
            console.log("No more words available.");
            return;
        }
        let wordIndex = Math.floor(Math.random() * wordSize);
        const newSolution = dictWords[wordIndex];
        setSolution(newSolution);
        console.log("solution", newSolution);
    };

    useEffect(() => {
        initializeGame();
    }, []);

    // Keep WebSocket connection open while page is loaded
    useEffect(() => {
        const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
        const wsUrl = `${wsProtocol}://${window.location.hostname}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setConnectionStatus("connected");
        ws.onerror = () => setConnectionStatus("error");
        ws.onclose = () => setConnectionStatus("disconnected");

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, []);

    // Ping loop: send 'ping' every 2 seconds if connected
    useEffect(() => {
        const interval = setInterval(() => {
            if (wsRef.current) {
                console.log("WebSocket readyState:", wsRef.current.readyState);
                if (wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send("ping");
                    console.log("Ping sent");
                }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const resetGame = () => {
        setWordHistory(prevHistory => [...prevHistory, solution]);
        initializeGame();
    };

    return (
        <div className="Apps">
            <h1>React Wordle</h1>
            <div style={{ marginBottom: '1em' }}>
                <strong>ESP32-S3 WebSocket:</strong> {connectionStatus}
            </div>
            <Wordle solution={solution} words={words} resetGame={resetGame} />
        </div>
    );
};
