import React, { useEffect, createRef, useState, useRef } from 'react';
import useMousePosition from '../hooks/useMousePosition';
import { AUTH_HEADER } from '../keys/Imagga';

function SegmentationController({ imageName, imageSrc, prevImageHandler, nextImageHandler, noiseLevel, currentClassificationCorrect, setCurrentClassificationCorrect }) {
    const imageCanvasRef = createRef();
    const segmentationCanvasRef = createRef();
    const penCanvasRef = createRef();
    const canvasContainerRef = createRef();

    const [mouseCoords, handleMouseCoords] = useMousePosition();
    const [isDrawing, setIsDrawing] = useState(false);

    const brushSize = useRef(10);
    const brushColor = useRef("rgba(255, 0, 0, 1)");
    const [erasing, setErasing] = useState(false);
    const penCircleVisible = useRef(false);

    const [currentTag, setCurrentTag] = useState(undefined);
    const [classifyingMessage, setClassifyingMessage] = useState(undefined);

    useEffect(() => {
        // Clear the canvas
        imageCanvasRef.current.removeAttribute("data-caman-id");

        // Add the new image with noise
        window.Caman("#image-canvas", imageSrc, function () {
            // this.resize({
            //     width: Math.ceil(window.innerWidth * .6)
            // });
            this.noise(noiseLevel);
            this.render();
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

    function handleNextImage() {
        if (currentClassificationCorrect !== undefined) {
            setCurrentTag(undefined);
            setClassifyingMessage(undefined);
            nextImageHandler();
        }
    }

    function handleSetCurrentClassificationCorrect(event) {
        setCurrentClassificationCorrect(parseInt(event.target.value));
    }

    function handleClassify() {
        // Use Imagga to classify image
        const auth = AUTH_HEADER;

        setClassifyingMessage(" Please wait...");

        const formData = new FormData();
        formData.append("image_base64", imageCanvasRef.current.toDataURL().split(';base64,')[1]);

        fetch("https://api.imagga.com/v2/tags?limit=1", {
            method: "POST",
            headers: new Headers({
                "Authorization": auth
            }),
            body: formData
        }).then(tagResponse => tagResponse.json())
            .then(tagData => {
                if (tagData.status.type !== "success") {
                    setClassifyingMessage("An error occurred. Please go to the next image.");
                    setCurrentClassificationCorrect(0);
                    return;
                }
                setCurrentTag(tagData.result.tags[0].tag.en);
                setClassifyingMessage(undefined); 
            });
    }

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
            <p>Please draw over the main object of the image in red.</p>
            <p>Also decide if the provided classification is correct.</p>
            <div>
                <div>Is this label correct: 
                    {currentTag ? (" " + currentTag) : 
                        (classifyingMessage ||
                            <button type="button" onClick={handleClassify}>Run classification</button>
                        )}
                </div>
                <input type="radio" id="wrong" name="is-correct" value="0"
                    onChange={e => handleSetCurrentClassificationCorrect(e)}
                    checked={currentClassificationCorrect === 0} />
                <label htmlFor="wrong">Wrong</label>
                <input type="radio" id="correct" name="is-correct" value="1"
                    onChange={e => handleSetCurrentClassificationCorrect(e)}
                    checked={currentClassificationCorrect === 1} />
                <label htmlFor="correct">Correct</label>
            </div>
            <div>
                {/* <button type="button" onClick={prevImageHandler}>Prev</button> */}
                <button type="button" onClick={handleNextImage} disabled={currentClassificationCorrect === undefined}>Next</button>
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
            <div id="canvas-container"
                ref={canvasContainerRef}
                style={{ position: "relative", top: "30px", margin: "auto", minHeight: "fit-content", marginBottom: "50px" }}>
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