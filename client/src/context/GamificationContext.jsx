import React, { createContext, useContext, useState, useEffect } from 'react';
import LevelUpOverlay from '../components/LevelUpOverlay';
import { useAuth } from './AuthContext';

const GamificationContext = createContext(null);

export const GamificationProvider = ({ children }) => {
    const { user } = useAuth();
    
    // Default initial state
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [showLevelUp, setShowLevelUp] = useState(false);
    
    // Experience Points table
    const getXpForNextLevel = (currentLevel) => {
        return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
    };

    // Load from local storage or initialize based on user
    useEffect(() => {
        if (user) {
            const storedData = localStorage.getItem(`gamification_${user.id || user._id}`);
            if (storedData) {
                const parsed = JSON.parse(storedData);
                setXp(parsed.xp || 0);
                setLevel(parsed.level || 1);
            }
        }
    }, [user]);

    // Save to local storage on change
    useEffect(() => {
        if (user) {
            localStorage.setItem(
                `gamification_${user.id || user._id}`, 
                JSON.stringify({ xp, level })
            );
        }
    }, [xp, level, user]);

    const addXp = (amount) => {
        setXp(prevXp => {
            const newXp = prevXp + amount;
            const requiredXp = getXpForNextLevel(level);
            
            if (newXp >= requiredXp) {
                // Level Up!
                setLevel(prevLevel => prevLevel + 1);
                setShowLevelUp(true);
                // Carry over XP
                return newXp - requiredXp;
            }
            
            return newXp;
        });
    };

    // Actions that grant XP
    const awardTaskCompletion = () => addXp(50);
    const awardProjectCompletion = () => addXp(200);
    const awardDailyLogin = () => addXp(10);
    
    const contextValue = {
        xp,
        level,
        nextLevelXp: getXpForNextLevel(level),
        progress: (xp / getXpForNextLevel(level)) * 100,
        awardTaskCompletion,
        awardProjectCompletion,
        awardDailyLogin,
        addXp
    };

    return (
        <GamificationContext.Provider value={contextValue}>
            {children}
            {showLevelUp && (
                <LevelUpOverlay 
                    level={level} 
                    onClose={() => setShowLevelUp(false)} 
                />
            )}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => useContext(GamificationContext);
