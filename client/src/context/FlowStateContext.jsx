import { createContext, useContext, useState, useEffect } from 'react';

const FlowStateContext = createContext();

export const FlowStateProvider = ({ children }) => {
    const [isFlowActive, setIsFlowActive] = useState(() => {
        return localStorage.getItem('flowState') === 'active';
    });

    useEffect(() => {
        localStorage.setItem('flowState', isFlowActive ? 'active' : 'inactive');

        // Add class to body for global CSS effects if needed
        if (isFlowActive) {
            document.body.classList.add('flow-state-active');
        } else {
            document.body.classList.remove('flow-state-active');
        }
    }, [isFlowActive]);

    const toggleFlowState = () => {
        setIsFlowActive(prev => !prev);
    };

    return (
        <FlowStateContext.Provider value={{ isFlowActive, toggleFlowState }}>
            {children}
        </FlowStateContext.Provider>
    );
};

export const useFlowState = () => useContext(FlowStateContext);
