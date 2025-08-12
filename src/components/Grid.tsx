import { Fragment } from 'preact';
import { Row } from "./_index";

export const Grid = ({ guesses, currentGuess, turn }) => {
    return(
    <>
        <div className="grid">
            {guesses.map((guess, i) => {
                return (
                    <Row 
                        key={i} 
                        guess={turn === i ? undefined : guess} 
                        currentGuess={turn === i ? currentGuess : undefined} 
                    />
                );
            })}
        </div>
    </>
    );
}