import { useState, useEffect } from 'react';
import './App.css';
import GearDisplay from './GearDisplay';

const INITIAL_GEAR_RADIUS_MULTIPLIER = 0.2;

function App() {
  const [displaySizeMultiplier, setDisplayMode] = useState(2);
  const [referenceValue, setReferenceValue] = useState(0);
  
  // State to track if the aspect ratio is vertical (mobile/portrait)
  const [isVertical, setIsVertical] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    // Handler to check aspect ratio on resize
    const handleResize = () => {
      setIsVertical(window.innerHeight > window.innerWidth);
    };

    // Initialize reference value based on screen width
    const initR = Math.max(60, Math.round(window.innerWidth * INITIAL_GEAR_RADIUS_MULTIPLIER * (isVertical ? 1 : 0.7) / 60) * 60);
    setReferenceValue(initR * 2);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const btnStyle = (isActive) => ({
    background: isActive ? '#2ecc71' : '#333',
    color: isActive ? '#fff' : '#aaa',
    border: '1px solid #555',
    padding: '5px 10px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9em',
    marginLeft: '5px',
    transition: 'all 0.2s'
  });

  const inputStyle = {
    background: '#333',
    border: '1px solid #555',
    color: 'white',
    padding: '5px',
    borderRadius: '4px',
    width: '80px',
    marginLeft: '10px'
  };

  return (
    <div className="App">
      
      <header> 
        :<img className='headerIcon' src='/simple-gear-calculator/simple_gear_logo.png' alt='logo'/>
        : simple gear calculator 
      </header>
      
      <main style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row' }}> 
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          maxWidth: isVertical ? '100%' : '30%', 
          fontSize: 16, 
          padding: '2em', 
          textAlign: 'left'
        }}> 
            <h3> <b> How are gear rotation speeds calculated? </b> </h3>
            <p> Speeds of meshing gears are determined by their teeth number ratio. </p>
            <p> rpm1 = -rpm2 * (toothNumber2 / toothNumber1) </p>
              <p></p> 
            <h3> <b> How do i know if two gears can mesh with each other? </b> </h3>
            <p> Matching gears are determined by the module which must be the same for both gears, <br/> this is the same as saying the distances between the teeth are the same. </p>
            <p> module = diameter (d) / tooth number (z) </p>
            <p></p> 
            <h3> <b> What do the number in the simulation mean? </b> </h3>
            <p> {displaySizeMultiplier === 2 ? '⌀ size (diameter)' : 'r size (radius)'} <br/> z tooth number <br/> m module <br/> v speed (positive clockwise) </p>
            
            <hr style={{width: '100%', borderColor: '#444', margin: '20px 0'}}/>

            <h4> Adjust gear scaling </h4>
            <p style={{fontSize: '0.9em', color: '#aaa'}}> Adjust the displayed size of the first gear (only affects the box data) </p>
            
            <div style={{marginBottom: '10px'}}>
              <label> Display size: 
                <button onClick={() => { setDisplayMode(1); setReferenceValue(prev => prev / 2);}} 
                style={btnStyle(displaySizeMultiplier === 1)}> Radius </button> 

                <button onClick={() => { setDisplayMode(2); setReferenceValue(prev => prev * 2);}} 
                style={btnStyle(displaySizeMultiplier === 2)}> Diameter </button> 
              </label>
            </div>
            
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label> Current scale ({displaySizeMultiplier === 2 ? '⌀' : 'r'}): 
                <input 
                  type='number' 
                  value={Math.round(referenceValue * 100) / 100} 
                  onChange={(e) => setReferenceValue(parseFloat(e.target.value))}
                  style={inputStyle}
                /> 
              </label>
            </div>

        </div>

        {/* Przekazujemy stan do GearDisplay */}
        <GearDisplay userScale={referenceValue} displayMode={displaySizeMultiplier} > </GearDisplay>
      </main>

      <footer> 
        Made by Dominik Mat <i> (CS student, Poland) :) 2025 </i>
      </footer>

    </div>
  );
}

export default App;