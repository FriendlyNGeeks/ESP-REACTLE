import { useEffect, useState } from "preact/hooks";
import { Wordle } from "./_index";
import { dictionary } from "../data/dictionary";
import { Fragment } from 'preact';

export const Game = () => {
    const [solution, setSolution] = useState("");
    const [words, setWords] = useState([]);
    const [wordHistory, setWordHistory] = useState([]);

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

    const resetGame = () => {
        setWordHistory(prevHistory => [...prevHistory, solution]);
        initializeGame();
    };

    return (
        <>
            <div className="Apps">
                <h1>React Wordle</h1>
                <Wordle solution={solution} words={words} resetGame={resetGame} />
            </div>
        </>
    );
};