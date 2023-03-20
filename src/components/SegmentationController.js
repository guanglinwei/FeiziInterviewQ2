import React, { useEffect, createRef, useState, useRef } from 'react';
import useMousePosition from '../hooks/useMousePosition';

function SegmentationController({ imageName, imageSrc, prevImageHandler, nextImageHandler, noiseLevel }) {
    const imageCanvasRef = createRef();
    const segmentationCanvasRef = createRef();
    const penCanvasRef = createRef();

    const [mouseCoords, handleMouseCoords] = useMousePosition();
    const [isDrawing, setIsDrawing] = useState(false);

    const brushSize = useRef(10);
    const brushColor = useRef("rgba(255, 0, 0, 1)");
    const [erasing, setErasing] = useState(false);
    const penCircleVisible = useRef(false);

    useEffect(() => {
        // Clear the canvas
        imageCanvasRef.current.removeAttribute("data-caman-id");

        // Add the new image with noise
        window.Caman("#image-canvas", imageSrc, function () {
            this.noise(noiseLevel).render();

            // segmentationCanvasRef.current.width = this.width;
            // segmentationCanvasRef.current.height = this.height;
            // penCanvasRef.current.width = this.width;
            // penCanvasRef.current.height = this.height;
            // segmentationCanvasRef.current.width = imageCanvasRef.current.width;
            // segmentationCanvasRef.current.height = imageCanvasRef.current.height;
            // penCanvasRef.current.width = imageCanvasRef.current.width;
            // penCanvasRef.current.height = imageCanvasRef.current.height;
        });
        // eslint-disable-next-line
    }, [imageSrc]);

    // Make all canvases the same size.
    // These if statements are necessary because otherwise the canvas refs would update every time an input
    // event is received, causing the refs to constantly change and causing the segmenting to not work properly.
    useEffect(() => {
        if (segmentationCanvasRef.current.width !== imageCanvasRef.current.width) 
            segmentationCanvasRef.current.width = imageCanvasRef.current.width;
        
        if (segmentationCanvasRef.current.height !== imageCanvasRef.current.height)
            segmentationCanvasRef.current.height = imageCanvasRef.current.height;
        
        if (penCanvasRef.current.width !== imageCanvasRef.current.width)
            penCanvasRef.current.width = imageCanvasRef.current.width;
        
        if (penCanvasRef.current.height !== imageCanvasRef.current.height)    
            penCanvasRef.current.height = imageCanvasRef.current.height;

    }, [segmentationCanvasRef, penCanvasRef, imageCanvasRef]);

    function handleSaveImage() {
        // We need to replace the parts the user drew on with white, and then black everywhere else
        const ctx = segmentationCanvasRef.current.getContext("2d");
        const imgData = ctx.getImageData(0, 0,
            segmentationCanvasRef.current.width, segmentationCanvasRef.current.height);

        const pixels = imgData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            // Alpha = 0 means not part of the main object
            if (pixels[i + 3] === 0) {
                pixels[i] = 0;
                pixels[i + 1] = 0;
                pixels[i + 2] = 0;
                pixels[i + 3] = 255;
            }
            // Main object should be white in mask
            else {
                pixels[i] = 255;
                pixels[i + 1] = 255;
                pixels[i + 2] = 255;
                pixels[i + 3] = 255;
            }
        }

        // Make a temporary canvas to hold the mask
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = imgData.width;
        tempCanvas.height = imgData.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.putImageData(imgData, 0, 0);

        // Download the resulting mask
        const tempLink = document.createElement("a");
        document.body.appendChild(tempLink);
        tempLink.setAttribute("download", imageName + "_segmentation.png");
        // tempLink.setAttribute("href", segmentationCanvasRef.current.toDataURL("image/png").replace("image/png", "image/octet-stream"));
        tempLink.setAttribute("href", tempCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
        tempLink.click();
        document.body.removeChild(tempLink);
    }

    function handleBrushSizeChanged(event) {
        brushSize.current = event.target.value;
    }

    function handleErasingChanged() {
        setErasing(!erasing);
    }

    // #region Drawing functions
    useEffect(() => {
        const segCtx = segmentationCanvasRef?.current.getContext("2d");
        const penCtx = penCanvasRef?.current.getContext("2d");

        // Draw on the segmentation canvas
        if (!!segCtx && isDrawing) {
            // Erase a circular area
            if (erasing) {
                segCtx.save();
                segCtx.beginPath();
                segCtx.arc(mouseCoords.x, mouseCoords.y, brushSize.current / 2, 0, Math.PI * 2);
                segCtx.closePath();
                segCtx.clip();
                segCtx.clearRect(0, 0, segmentationCanvasRef.current.width, segmentationCanvasRef.current.height);
                segCtx.restore();
            } else {
                segCtx.lineTo(mouseCoords.x, mouseCoords.y);
                segCtx.stroke();
                segCtx.moveTo(mouseCoords.x, mouseCoords.y);
            }
        }

        // Show pen circle on pen canvas
        if (!!penCtx && penCircleVisible.current) {
            penCtx.clearRect(0, 0, penCanvasRef.current.width, penCanvasRef.current.height);
            penCtx.lineWidth = 4;
            // penCtx.strokeStyle = brushColor.current;

            // Make the color of the circle black and white so it can always be seen
            for (let i = 0; i < 4; i++) {
                penCtx.strokeStyle = i % 2 === 0 ? "black" : "white";

                penCtx.beginPath();
                penCtx.arc(mouseCoords.x, mouseCoords.y, brushSize.current / 2, i * Math.PI / 2, (i + 1) * Math.PI / 2);
                penCtx.stroke();
            }
        }

        // eslint-disable-next-line
    }, [mouseCoords.x, mouseCoords.y]);

    function handleMouseDown(event) {
        event.preventDefault();
        const ctx = segmentationCanvasRef.current.getContext("2d");

        ctx.lineWidth = brushSize.current;
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(255, 0, 0, 1)";
        brushColor.current = ctx.strokeStyle;
        setIsDrawing(true);

        ctx.moveTo(mouseCoords.x, mouseCoords.y);

        if (!erasing)
            ctx.beginPath();
    }

    function handleMouseUp(event) {
        event.preventDefault();
        setIsDrawing(false);
    }

    function handleMouseEnter(event) {
        showPenCircle();
        handleMouseCoords(event);
        if (event.buttons === 1)
            handleMouseDown(event);
    }

    function showPenCircle() {
        penCircleVisible.current = true;
    }

    function hidePenCircle() {
        penCircleVisible.current = false;
    }

    // #endregion

    return (
        <div>
            <h3>{imageName}</h3>
            <div>
                <button type="button" onClick={prevImageHandler}>Prev</button>
                <button type="button" onClick={nextImageHandler}>Next</button>
                <br />
                <button type="button" onClick={handleSaveImage}>Save</button>
            </div>

            <div>
                <label>
                    Brush size:
                    <input type="range" min={1} max={80} onChange={handleBrushSizeChanged} value={brushSize.current} />
                </label>
                <br />
                <label>
                    Erase mode:
                    <input type="checkbox" onChange={handleErasingChanged} checked={erasing} value={"Erase mode"} />
                </label>
            </div>

            {/* Canvases */}
            <div style={{ position: "relative", top: "30px", margin: "auto", minHeight: "fit-content", marginBottom: "50px" }}>
                {/* Canvas with image itself */}
                <canvas id="image-canvas"
                    ref={imageCanvasRef}
                    style={{ margin: "auto", marginBottom: "50px", zIndex: 0 }} />

                {/* Canvas with user-drawn segmentation */}
                <canvas id="segmentation-canvas"
                    ref={segmentationCanvasRef}
                    onMouseMove={e => handleMouseCoords(e)}
                    onMouseDown={e => handleMouseDown(e)}
                    onMouseUp={e => handleMouseUp(e)}
                    onMouseLeave={e => { handleMouseUp(e); hidePenCircle(); }}
                    onMouseEnter={e => handleMouseEnter(e)}
                    style={{ position: "absolute", left: 0, top: 0, right: 0, margin: "auto", zIndex: 1 }} />

                {/* Canvas with circle representing pen */}
                <canvas id="pen-canvas"
                    ref={penCanvasRef}
                    // onMouseMove={e => handleMouseCoords(e)}
                    // onMouseEnter={showPenCircle}
                    // onMouseLeave={hidePenCircle}
                    style={{ position: "absolute", left: 0, top: 0, right: 0, margin: "auto", zIndex: 2, pointerEvents: "none" }} />
            </div>
        </div>
    );
}

export default SegmentationController;