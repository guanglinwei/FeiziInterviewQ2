import React, { createRef, useState } from 'react';

export default function Upload({ uploadHandler }) {
    const [errorMessage, setErrorMessage] = useState(null);

    const fileInput = createRef();

    function handleSubmit(event) {
        event.preventDefault();

        const files = [...fileInput.current.files];
        if (files.length === 0) return;

        if (files.every(file => ["image/jpeg", "image/png"].includes(file.type))) {
            setErrorMessage(null);
            uploadHandler(files);
        } else {
            setErrorMessage("All files must be of type .jpg or .png");
        }
    }

    return (
        <div>
            {errorMessage ? <h3>{errorMessage}</h3> : undefined}
            <form onSubmit={handleSubmit}>
                <label>
                    Upload your images (PNG/JPG): 
                    <input type="file" ref={fileInput} accept=".jpg, .jpeg, .png" multiple/>
                </label>
                <br/>
                <button type="submit">Upload</button>
            </form>
        </div>
    );
}
