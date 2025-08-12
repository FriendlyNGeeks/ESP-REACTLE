import { useEffect, useState } from "preact/hooks";
import useWordle from "../hooks/useWordle";
import { Grid, Keypad, Modal } from "./_index";
// import { useNavigate } from "react-router-dom";
import { useLocation } from "wouter";
import letters from "../data/letters";
import { Fragment } from 'preact';

export const Wordle = ({ words, solution, resetGame }) => {
    const {
        currentGuess,
        setCurrentGuess,
        guesses,
        isCorrect,
        turn,
        handleKeyUp,
        errorMsg,
        setErrorMsg,
        usedKeys,
        reset
    } = useWordle(words, solution);
    const [location, navigate] = useLocation();

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        window.addEventListener("keyup", handleKeyUp);
        if (isCorrect || turn > 5) {
            setTimeout(() => setShowModal(true), 1500);
            window.removeEventListener("keyup", handleKeyUp);
        }
        return () => window.removeEventListener("keyup", handleKeyUp);
    }, [handleKeyUp, isCorrect, turn]);

    const closeModal = () => {
        console.log("close modal");
        setShowModal(false);
        reset();
        resetGame(); // Call resetGame when closing the modal
    };

    return(
    <>
        <div className="main">
            <div className="moves">Moves: {turn}/6</div>
            <Grid guesses={guesses} currentGuess={currentGuess} turn={turn} />
            {errorMsg && (
                <div className="error">
                    <p>{errorMsg}</p>
                    <button
                        onClick={() => {
                            setErrorMsg("");
                            setCurrentGuess("");
                        }}
                    >
                        X
                    </button>
                </div>
            )}
            <Keypad letters={letters} usedKeys={usedKeys} />
            {showModal && (
                <Modal
                    isCorrect={isCorrect}
                    turn={turn}
                    solution={solution}
                    resetGame={resetGame}
                    closeModal={closeModal}
                />
            )}
        </div>
    </>
    );
};


