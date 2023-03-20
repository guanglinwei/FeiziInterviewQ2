import { useEffect, useState } from "react";

const useMousePosition = () => {
    const [mouseCoords, setMouseCoords] = useState({
        x: 0,
        y: 0
    });

    const handleCursorMovement = (event) => {
        let rect = event.target.getBoundingClientRect();
        setMouseCoords({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        });
    };
    useEffect(() => {

        window.addEventListener("mousemove", handleCursorMovement);

        return () => {
            window.removeEventListener("mousemove", handleCursorMovement);
        };
    }, []);

    return [mouseCoords, handleCursorMovement];
};

export default useMousePosition;