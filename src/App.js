import React, { useState } from 'react';
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import Upload from './components/Upload';
import ImageContext from './context/ImageContext';
import Segment from './components/Segment';

function App() {
    return (
        <HashRouter>
            <AppController/>
        </HashRouter>
    );
}

function AppController() {
    const [files, setFiles] = useState([]);

    const navigate = useNavigate();

    // Run when the user clicks the upload button in Upload component
    function handleImagesUploaded(files) {
        setFiles(files);
        console.log(files);
        navigate("/segment");
    }    

    return (
        <div style={{ textAlign: "center" }}>
            <h1>Image Segmentation</h1>
            <ImageContext.Provider value={files}>
                <Routes>
                    <Route exact path="/" element={<Upload uploadHandler={handleImagesUploaded} />} />
                    <Route path="/segment" element={<Segment/>} />
                </Routes>
            </ImageContext.Provider>
        </div>
    );
}

export default App;
