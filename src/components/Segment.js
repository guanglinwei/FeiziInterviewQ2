import React, { useContext, useEffect, useState } from 'react';
import ImageContext from '../context/ImageContext';
import { Navigate } from 'react-router-dom';
import SegmentationController from './SegmentationController';
import ContinueOrEnd from './ContinueOrEnd';

function Segment() {
    const files = useContext(ImageContext);
    const [imageSrc, setImageSrc] = useState(null);
    const [imageName, setImageName] = useState("");
    const [noiseLevel, setNoiseLevel] = useState(0);
    const [imageIndex, setImageIndex] = useState(0);
    const [isSegmenting, setIsSegmenting] = useState(true);
    const [classifications, setClassifications] = useState([]);

    // When the files or image changes
    useEffect(() => {
        // console.log("loading image " + imageIndex + "...");
        const reader = new FileReader();
        reader.addEventListener("load", e => {
            setImageSrc(e.target.result);
        });

        if (!!files[imageIndex]) {
            reader.readAsDataURL(files[imageIndex]);
            setImageName(files[imageIndex].name.replace(/\.[^/.]+$/, ""));
        }
    }, [files, imageIndex]);

    function prevImage() {
        if (imageIndex > 0)
            setImageIndex(n => n - 1);
    }

    function nextImage() {
        // If no more files, start again with noise
        if (imageIndex + 1 >= files.length) {
            setIsSegmenting(false);
            return;
        }

        setImageIndex(imageIndex + 1);
    }

    // Called if user decides to add noise to images after segmenting all of them
    function returnToSegmentation() {
        setNoiseLevel(n => n + 20);
        setImageIndex(0);
        setIsSegmenting(true);
    }

    function setCurrentClassificationCorrect(correct) {
        const c = [...classifications];
        c[imageIndex] = correct;
        setClassifications(c);
    }

    if (isSegmenting) {
        return (
            <div>
                {!!files && files.length > 0 && imageIndex < files.length ?
                    (!!imageSrc ?
                        <div>
                            <SegmentationController
                                imageName={imageName}
                                imageSrc={imageSrc}
                                prevImageHandler={prevImage}
                                nextImageHandler={nextImage}
                                noiseLevel={noiseLevel} 
                                currentClassificationCorrect={classifications[imageIndex]}
                                setCurrentClassificationCorrect={setCurrentClassificationCorrect}/>
                        </div> :
                        <div>Loading...</div>
                    ) :
                    // If there are no more images, then redirect back to the main page
                    <Navigate to="/" replace />
                }
            </div>
        );
    }
    else {
        return <ContinueOrEnd handleReturnToSegmentation={returnToSegmentation} classifications={classifications}/>
    }
}

export default Segment;