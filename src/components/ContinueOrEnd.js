import { useNavigate } from 'react-router-dom';

function ContinueOrEnd({ handleReturnToSegmentation }) {
    const navigate = useNavigate();

    function redirectToHome() {
        navigate("/");
    }

    return (
        <div>
            <h2>You have segmented all images.</h2>
            <button type="button" onClick={handleReturnToSegmentation}>Add noise and segment again</button>
            <button type="button" onClick={redirectToHome}>Finish</button>
            
        </div>
    );
}

export default ContinueOrEnd;