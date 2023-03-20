import { useNavigate } from 'react-router-dom';

function ContinueOrEnd({ handleReturnToSegmentation, classifications }) {
    const navigate = useNavigate();

    function redirectToHome() {
        navigate("/");
    }

    return (
        <div>
            <h2>You have segmented all images.</h2>
            <div>
                <h3>Correct classifications: {classifications.filter(v => v === 1).length} / {classifications.length}</h3>
            </div>
            <button type="button" onClick={handleReturnToSegmentation}>Add noise and segment again</button>
            <button type="button" onClick={redirectToHome}>Finish</button>
        </div>
    );
}

export default ContinueOrEnd;