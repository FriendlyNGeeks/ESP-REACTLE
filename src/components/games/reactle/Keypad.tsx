import { useEffect } from "preact/hooks";
import { Fragment } from 'preact';

export const Keypad = ({ letters, usedKeys }) => {
    const handleBtnClick = key => {
        window.dispatchEvent(
            new KeyboardEvent("keyup", {
                key,
            })
        );
    };

    useEffect(() => {}, [usedKeys]);
    return(
    <>
        <div className="keypad">
            {letters.map((row, i) => (
                <div className="row" key={i}>
                    {row.map((l, i) => (
                        <div
                            key={i}
                            onClick={() => handleBtnClick(l)}
                            className={usedKeys[l]}
                        >
                            {l}
                        </div>
                    ))}
                </div>
            ))}

            <div className="buttons">
                <div
                    className="kp-icons delete"
                    onClick={() => handleBtnClick("Backspace")}
                >
                    <svg
                        stroke="currentColor"
                        fill="currentColor"
                        stroke-width="0"
                        viewBox="0 0 512 512"
                        height="1em"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg">
                            <path
                                fill="none"
                                stroke-linejoin="round"
                                stroke-width="32"
                                d="M135.19 390.14a28.79 28.79 0 0021.68 9.86h246.26A29 29 0 00432 371.13V140.87A29 29 0 00403.13 112H156.87a28.84 28.84 0 00-21.67 9.84v0L46.33 256l88.86 134.11z">
                            </path>
                            <path
                                fill="none"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="32"
                                d="M336.67 192.33L206.66 322.34m130.01 0L206.66 192.33m130.01 0L206.66 322.34m130.01 0L206.66 192.33">
                            </path>
                    </svg>
                </div>
                <div
                    className="kp-icons enter"
                    onClick={() => handleBtnClick("Enter")}
                >
                    <svg
                        stroke="currentColor"
                        fill="currentColor"
                        stroke-width="0"
                        viewBox="0 0 16 16"
                        height="1em"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg">
                            <path
                                fill-rule="evenodd"
                                d="M14.5 1.5a.5.5 0 0 1 .5.5v4.8a2.5 2.5 0 0 1-2.5 2.5H2.707l3.347 3.346a.5.5 0 0 1-.708.708l-4.2-4.2a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 8.3H12.5A1.5 1.5 0 0 0 14 6.8V2a.5.5 0 0 1 .5-.5z">
                            </path>
                    </svg>
                </div>
            </div>
        </div>
    </>
    );
};
