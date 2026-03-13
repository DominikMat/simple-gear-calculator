import { useState } from "react";

const CONTROLS_BACKGROUND_COLOUR = '#282c34';


// Kolory dla różnych akcji (łatwo zmieniać w jednym miejscu)
export default function ControlButton ({ onClick, label, tooltipText, defaultColour, hoverColor = 'darkgrey' }) {
    const [isHovered, setIsHovered] = useState(false);

    // Łączymy bazowy styl z dynamicznym kolorem ramki
    const computedStyle = {
        ...baseBtnStyle, // Twój obecny styl
        borderColor: isHovered ? hoverColor : defaultColour,
        color: isHovered ? hoverColor : defaultColour,
    };

    return (
        <div style={{ position: 'relative' }}> {/* Wrapper potrzebny do pozycjonowania tooltipa */}
            
            <button
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={computedStyle}
            >
                {label}
            </button>

            {/* Tooltip pojawia się tylko gdy isHovered === true */}
            {isHovered && (
                <div style={tooltipStyle}>
                    {tooltipText}
                </div>
            )}
        </div>
    );
};

// Style wyciągnięte poza komponent
const baseBtnStyle = {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: '1px',
    borderStyle: 'solid',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // /fontWeight: 'bold',
    transition: 'all 0.2s ease', // Dodaje płynność zmiany koloru
    //fontSize: '14px',
    padding: 0,
    background: CONTROLS_BACKGROUND_COLOUR,
};

const tooltipStyle = {
    position: 'absolute',
    bottom: '100%', // Wyświetl NAD przyciskiem
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '8px',
    padding: '4px 8px',
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '2px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none', // Myszka przenika przez tooltip
    zIndex: 10,
};