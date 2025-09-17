// src/hooks/useNextStep.js
import { useNavigate } from 'react-router-dom';

const useNextStep = () => {
  const navigate = useNavigate();

  const handleNextStep = () => {
    let steps = JSON.parse(localStorage.getItem('pendingSteps') || '[]');
    steps.shift(); // Remove current step
    if (steps.length > 0) {
      localStorage.setItem('pendingSteps', JSON.stringify(steps));
      navigate(`/${steps[0]}`, { replace: true });
    } else {
      localStorage.removeItem('pendingSteps');
      navigate('/Proposal', { replace: true }); // Default last page
    }
  };

  return handleNextStep;
};

export default useNextStep;