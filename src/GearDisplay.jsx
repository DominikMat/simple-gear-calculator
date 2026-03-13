import { useEffect, useRef, useState, useMemo } from 'react';
import { setHslaAlpha, generateRandomColour } from './ColourFunctions'; // Zakładam, że ten plik istnieje
import ControlButton from './ControlButton';

const TWO_PI = Math.PI * 2;
const CONNECTOR_COLOUR = '#555';
const CONNECTOR_OFFSET_MULTIPLIER = 1.35;
const CONNECTOR_ARC_SPAN = Math.PI/6;
const GEAR_ORIGIN_POINT_SIZE = 2;
const TETHER_LINE_WIDTH = 4;
const INITIAL_GEAR_Radius_MULTIPLIER = 0.2;
const GEAR_CHAIN_POSITION_X_MULTIPLIER = 0.5;
const GEAR_CHAIN_POSITION_Y_MULTIPLIER = 1.2;
const ANIMATION_GEAR_POSITION_DURATION = 1 * 1000;
const ANIMATION_TETHER_DURATION = 1 * 1000;
const ANIMATION_GEAR_INITALIZATION_DURATION = 2 * 1000;

const MINIMUM_GEAR_RADIUS = 15;
const MINIMUM_GEAR_TEETH = 3;
const MINIMUM_GEAR_MODULE = 1;

const CONTROLS_BACKGROUND_COLOUR = '#282c34';

// --- KLASA MODELU ---
class Gear {
    constructor(x, y, radius, toothNumber, colour) {
        this.x = x;
        this.y = y;
        this.r = radius;
        this.toothNumber = toothNumber;
        this.colour = colour;
        this.isTetheredBefore = false;
        this.isTetheredAfter = false;
        this.rotation = 0;
        this.module = radius / toothNumber;
        this.rotationSpeed = 1;

        this.initalizationAnimationProgress = 1;
        this.initializationAnimationStartTime = 0;
        this.tetherAnimationStartTime = 0;
        this.tetherAnimationProgress = 1;
        this.positionAnimationStartTime = 0;
        this.positionAnimationOrigin = y;
        this.positionAnimationTarget = y;
    }

    setTethered(state, direction) {
        if (direction) this.isTetheredAfter = state;
        else this.isTetheredBefore = state;
    }

    rotate(deltaAngle) {
        this.rotation += deltaAngle * this.rotationSpeed;
        if (this.rotation < 0) this.rotation = TWO_PI + this.rotation;
        if (this.rotation > TWO_PI) this.rotation -= TWO_PI;
    }

    alignRotationTo(prevGear) {
        if (this.isTetheredBefore) return;

        const ratio = prevGear.toothNumber / this.toothNumber;

        this.rotation = -prevGear.rotation * ratio + (Math.PI / 2) * (1 -ratio) + (Math.PI / this.toothNumber);
        if (this.toothNumber%2 === prevGear.toothNumber%2) this.rotation += Math.PI/this.toothNumber;

        this.rotation = this.rotation % TWO_PI;
        if (this.rotation < 0) this.rotation += TWO_PI;
    }

    startInitalizationAnimation (currentTime) {
        this.initializationAnimationStartTime = currentTime;
    }
    startPositionAnimation (currentTime, target) {
        this.positionAnimationStartTime = currentTime;
        this.positionAnimationOrigin = this.y;
        this.positionAnimationTarget = target;
    }
    startTetherAnimation (currentTime) {
        this.tetherAnimationStartTime = currentTime;
    }
    animate (currentTime) {
        this.initalizationAnimationProgress = Math.min(1,(currentTime - this.initializationAnimationStartTime) / ANIMATION_GEAR_INITALIZATION_DURATION);
        
        let positionAnimationTime = (currentTime - this.positionAnimationStartTime) / ANIMATION_GEAR_POSITION_DURATION;
        if (positionAnimationTime < 1.05) {
            positionAnimationTime = Math.min(1,positionAnimationTime); // make sure there is a frame to set exact target position
            this.y = this.positionAnimationTarget*positionAnimationTime + this.positionAnimationOrigin*(1-positionAnimationTime);
        }

        this.tetherAnimationProgress = Math.min(1,(currentTime - this.tetherAnimationStartTime) / ANIMATION_TETHER_DURATION);
    }
}

// --- FUNKCJE RYSOWANIA ---
function drawGear (ctx, gear) {
    const anglePerSegment = TWO_PI / (gear.toothNumber*2);
    const pressurePointPosition = .8;
    const pressureAngleMultiplier = Math.min(0.25, 0.5 / (gear.toothNumber/8));
    const toothSize = gear.r*(2/gear.toothNumber);

    // draw gear outline
    ctx.beginPath();
    
    for (let i=0; i<(gear.toothNumber*2+1)*gear.initalizationAnimationProgress; i++) { // +1 to make sure we cover path to starting point as well
        const currentAngle = i*anglePerSegment;

        if (i%2 === 0){
            let startAngle = gear.rotation + currentAngle;
            let endAngle = gear.rotation + currentAngle + anglePerSegment;
            ctx.arc(gear.x,gear.y,gear.r-toothSize*pressurePointPosition,startAngle,endAngle);
        } else {
            let startAngle = gear.rotation + currentAngle + anglePerSegment*pressureAngleMultiplier;
            let endAngle = gear.rotation + currentAngle+anglePerSegment*(1-pressureAngleMultiplier);
            ctx.arc(gear.x,gear.y,gear.r+toothSize*(1-pressurePointPosition), startAngle, endAngle);
        }
    }

    // fill colour 
    if (gear.initalizationAnimationProgress === 1) {
        ctx.fillStyle = setHslaAlpha(gear.colour,0.5);
        ctx.fill();
    }
    
    // draw border
    ctx.strokeStyle = setHslaAlpha(gear.colour,1.0);
    ctx.lineWidth = 3;
    ctx.stroke();
    
    if (gear.initalizationAnimationProgress === 1) {
        // draw origin point
        ctx.beginPath();
        ctx.arc(gear.x,gear.y,GEAR_ORIGIN_POINT_SIZE,0,TWO_PI);
        
        // fill colour
        ctx.fillStyle = setHslaAlpha(gear.colour,1.0);
        ctx.fill();
    }
}
function drawGearLinkage(ctx, gear, prevGear, maxOffsetX){
    // draw tether line
    if (gear.isTetheredBefore) {
        ctx.beginPath();
        ctx.strokeStyle = '#000000ff'
        ctx.lineWidth = TETHER_LINE_WIDTH;
        

        ctx.arc(gear.x,gear.y,TETHER_LINE_WIDTH,0,Math.PI);
        ctx.lineTo(prevGear.x-GEAR_ORIGIN_POINT_SIZE*2,gear.y+(prevGear.y-gear.y)*Math.min(1,gear.tetherAnimationProgress*2));
        ctx.moveTo(prevGear.x-GEAR_ORIGIN_POINT_SIZE*2,prevGear.y);

        if (gear.tetherAnimationProgress >= 0.5) ctx.arc(prevGear.x,prevGear.y,GEAR_ORIGIN_POINT_SIZE*2,Math.PI,TWO_PI);
        else ctx.moveTo(prevGear.x+GEAR_ORIGIN_POINT_SIZE*2,prevGear.y);

        ctx.lineTo(gear.x+GEAR_ORIGIN_POINT_SIZE*2,prevGear.y+(gear.y-prevGear.y)*Math.max(0,(gear.tetherAnimationProgress-0.5)*2));
        //ctx.moveTo(gear.x-GEAR_ORIGIN_POINT_SIZE*2,gear.y);
        //ctx.arc(gear.x,gear.y,TETHER_LINE_WIDTH,0,Math.PI);

        ctx.stroke();
    }

    // draw linking arc for controls
    let largerRadius = Math.max(prevGear.r,gear.r);
    let smallerRadius = Math.min(prevGear.r,gear.r);

    let posX = gear.x + Math.min(largerRadius*(CONNECTOR_OFFSET_MULTIPLIER-1),maxOffsetX-largerRadius); // this is the x for the origin of the arc
    let posY = ((gear.y-gear.r)+(prevGear.y+prevGear.r))/2;
    let arcSpan = CONNECTOR_ARC_SPAN * Math.max(0.25,smallerRadius/largerRadius);

    ctx.beginPath();
    ctx.strokeStyle = CONNECTOR_COLOUR;
    ctx.lineWidth = 2;
    ctx.arc(posX, posY, largerRadius, -arcSpan, arcSpan);
    ctx.stroke();
}

function GearEditForm ({ gear, index, onApply, onCancel, scale, sizeMultiplier }) {
    const [formData, setFormData] = useState({
        radius: Math.round(gear.r*scale*sizeMultiplier*100)/100,
        toothNumber: gear.toothNumber,
        module: parseFloat((gear.module*scale).toFixed(3)),
        speed: parseFloat(gear.rotationSpeed.toFixed(2))
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });
    };

    const handleApplyClick = () => {
        onApply(index, formData);
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', 
            maxWidth:'10em', marginLeft:'1em', gap: '4px',
            background: 'rgba(0,0,0,0.8)', padding: '10px', borderRadius: '8px', zIndex: 100
        }}>
            { index != 0 ? (
                <label style={labelStyle}>Size: <input name="radius" type="number" value={formData.radius} onChange={handleChange} style={inputStyle}/></label>
            ) : (<div> Scale & Mod: change scale on left </div>)}
            <label style={labelStyle}>Teeth: <input name="toothNumber" type="number" value={formData.toothNumber} onChange={handleChange} style={inputStyle}/></label>
            { index != 0 ? (
                <label style={labelStyle}>Module: <input name="module" type="number"  value={formData.module} onChange={handleChange} style={inputStyle}/></label>
            ) : (null)}
            <label style={labelStyle}>Speed: <input name="speed" type="number" value={formData.speed} onChange={handleChange} style={inputStyle}/></label>
            
            <button 
                className="apply-btn" // Użyjemy CSS-in-JS lub stylu poniżej
                onClick={handleApplyClick}
                style={applyBtnStyle}
            >
                Apply
            </button>
        </div>
    );
};

// Style
const labelStyle = { color: '#ccc', fontSize: '12px', display: 'flex', justifyContent: 'space-between' };
const inputStyle = { width: '50px', background: '#333', border: 'none', color: '#fff', borderRadius: '4px', padding: '2px' };
const applyBtnStyle = {
    marginTop: '5px', padding: '5px', borderRadius: '4px', border: 'none',
    background: '#444', color: '#fff', cursor: 'pointer', fontWeight: 'bold',
    transition: 'background 0.2s, transform 0.1s'
};

const AlertItem = ({ alert, onDismiss }) => {
    // Style w zależności od typu
    const borderColor = alert.type === 'error' ? '#e74c3c' : '#f39c12'; // Czerwony lub Pomarańczowy
    const icon = alert.type === 'error' ? '[ERR]' : '/!\\';

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(alert.id), 8000); // Auto-dismiss 5s
        return () => clearTimeout(timer);
    }, [alert.id, onDismiss]);

    return (
        <div 
            onClick={() => onDismiss(alert.id)}
            style={{
                backgroundColor: CONTROLS_BACKGROUND_COLOUR,
                border: `2px solid ${borderColor}`,
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '10px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                gap: '10px',
                minWidth: '250px',
                animation: 'fadeIn 0.3s ease-out',
                fontSize: 'larger',
                fontWeight: 'bold',
                alignItems: 'center',
            }}
        >
            <span style={{ fontSize: '1.2em' }}>{icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9em' }}>{alert.message}</span>
            </div>
        </div>
    );
};

const AlertsContainer = ({ alerts, onDismiss }) => (
    <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        pointerEvents: 'none' // Żeby tło kontenera nie blokowało myszki
    }}>
        <div style={{ pointerEvents: 'auto' }}> {/* Przywracamy klikalność dla samych alertów */}
            {alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} onDismiss={onDismiss} />
            ))}
        </div>
    </div>
);

export default function GearDisplay( { userScale, displayMode } ) {
    const canvasRef = useRef(null);
    const gearsRef = useRef([]); // Trzymamy zębatki w refie (mutowalne, ale nie triggerują renderu)
    const [version, setVersion] = useState(0); // Służy do wymuszania renderu UI po dodaniu zębatki
    const [canvasHeight, setCanvasHeight] = useState(600);
    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);

    const [editingMode, setEditMode] = useState(false);
    const [editableGearIndex, setEditableGearIndex] = useState(0);
    const [maxElementOffsetX, setLargestElementOffset] = useState(60);

    const speedOriginGearIndexRef = useRef(0);
    const speedOriginValueRef = useRef(1);

    const [alerts, setAlerts] = useState([]); 

    const forceUpdate = () => setVersion(v => v + 1);

    /* add a new gear to the end of the chain */
    const addNewGear = (teeth, radius = -1, color = 'random') => {
        const gears = gearsRef.current;
        const lastGear = gears[gears.length - 1];
        
        if (radius === -1) {
            radius = (teeth / lastGear.toothNumber) * lastGear.r;
        }
        if (color === 'random') color = generateRandomColour();

        const newY = lastGear.y + lastGear.r + radius;
        const newGear = new Gear(lastGear.x, newY, radius, teeth, color, lastGear);
        newGear.alignRotationTo(lastGear);
        newGear.startInitalizationAnimation(performance.now());

        gears.push(newGear);
        recalculateSpeeds();
        recalculatePositions();
        realignGears();
        forceUpdate();
    };

    // Publiczne metody obsługi zdarzeń
    const handleAddGear = (index) => {
        const gears = gearsRef.current;
        const before = gears[index];
        const after = gears[index + 1];
        if (!before || !after) return;

        const newRadius = before.r;
        const newGear = new Gear(before.x, before.y + before.r + newRadius, newRadius, before.toothNumber, generateRandomColour(), before);
        
        gears.splice(index + 1, 0, newGear);
        
        speedOriginGearIndexRef.current += 1;
        
        newGear.alignRotationTo(before);
        newGear.startInitalizationAnimation(performance.now());

        
        recalculatePositions();
        recalculateSpeeds();
        realignGears();
        forceUpdate();
    };
    
    const handleRemoveGear = (index) => {
        const gears = gearsRef.current;
        if (index === 0 || index >= gears.length) return;
        if (index < gears.length-1) gearsRef.current[index+1].setTetheredBefore = false;
        gears.splice(index, 1);

        recalculatePositions();
        recalculateSpeeds();
        realignGears();
        forceUpdate();
    }

    const realignGears = () => {
        const gears = gearsRef.current;
        for (let i=1; i<gears.length; i++) gears[i].alignRotationTo(gears[i-1]);
    }

    const handleTether = (index) => {
        const gears = gearsRef.current;
        const gear = gears[index];
        const nextGear = gears[index + 1];
        if (!gear || !nextGear) return;

        const newState = !gear.isTetheredAfter;

        if (!newState && gear.module !== nextGear.module) {
            addAlert ("modules do not match, cannot untether", 'error');
        }
        else {
            gear.setTethered(newState, true);
            nextGear.setTethered(newState, false);

            if(newState) nextGear.startTetherAnimation(performance.now()); // second gears handles tether rendering
            else {
                realignGears ();
            }
        }

        recalculateSpeeds();
        recalculatePositions();
        forceUpdate();
    };

    const recalculateSpeeds = () => {        
        let originIndex = speedOriginGearIndexRef.current;
        let originSpeed = speedOriginValueRef.current;
        
        const gears = gearsRef.current;
        if (!gears[originIndex]) return;

        // Ustaw źródło
        gears[originIndex].rotationSpeed = originSpeed;

        // Propagate downwards
        for (let i = originIndex + 1; i < gears.length; i++) {
            const prev = gears[i-1];
            const curr = gears[i];
            const ratio = curr.isTetheredBefore ? 1 : -(prev.toothNumber / curr.toothNumber);
            curr.rotationSpeed = prev.rotationSpeed * ratio;
        }

        // Propagate upwards
        for (let i = originIndex - 1; i >= 0; i--) {
            const next = gears[i+1];
            const curr = gears[i];
            const ratio = next.isTetheredBefore ? 1 : -(next.toothNumber / curr.toothNumber);
            curr.rotationSpeed = next.rotationSpeed * ratio; 
        }
    };

    // 2. RECALCULATE POSITIONS: Oblicza pozycje Y (targetY) dla wszystkich zębatek
    const recalculatePositions = () => {
        const gears = gearsRef.current;
        if (gears.length === 0) return;

        let maxGearRadius = gears[0].r;
        
        // Śledzimy wirtualną pozycję Y, niezależnie od animacji
        let accumulatedY = gears[0].y; 

        for (let i = 1; i < gears.length; i++) {
            const prev = gears[i-1];
            const curr = gears[i];
            
            // Obliczamy dystans bazując na promieniach DOCELOWYCH (geometrycznych)
            let dist = prev.r + curr.r; 
            if (curr.isTetheredBefore) {
                dist += (prev.r + curr.r) * 0.2;
            }

            // Target Y dla obecnej zębatki
            const targetY = accumulatedY + dist;

            // Sprawdzamy czy trzeba animować
            if (Math.abs(targetY - curr.y) > 0.1) {
                curr.startPositionAnimation(performance.now(), targetY);
                setTimeout(forceUpdate, ANIMATION_GEAR_POSITION_DURATION + 50);
            }

            accumulatedY = targetY; // Przesuwamy wirtualny kursor w dół
            maxGearRadius = Math.max(maxGearRadius, curr.r);
        }

        // Ustawiamy wysokość na podstawie accumulatedY (celu), a nie obecnego y
        const lastGear = gears[gears.length-1];
        const newHeight = accumulatedY + lastGear.r + 150; // +150 zapasu
        
        setCanvasHeight(newHeight);
        setLargestElementOffset(Math.min(maxGearRadius,canvasWidth/4));
    };

    const handleApplyEdit = (index, data) => {
        const gears = gearsRef.current;
        const gear = gears[index];
        const prev = gears[index-1];
        const next = gears[index+1];

        // empty param -> default to current gear data
        if (!data.toothNumber) data.toothNumber = gear.toothNumber;

        // --- calculate real sized from custom (user providede) scale, referenced off gear nr1 size  ---
        const firstGearPixelR = gearsRef.current[0].r;
        const sizeMultiplier = displayMode;
        const scale = (userScale/sizeMultiplier) / firstGearPixelR;

        if (data.radius) data.radius /= (scale*sizeMultiplier);
        else data.radius = gear.r;
        if (data.module) data.module /= scale;
        else data.module = gear.module;

        // data validation before
        let beforeToothNum = gear.toothNumber;
        let beforeRadius = gear.r;
        let beforeModule = gear.module;

        if (data.toothNumber < MINIMUM_GEAR_TEETH) {
            addAlert (`Rounded to minimum number of gear teeth (${MINIMUM_GEAR_TEETH})`, 'warning');
            data.toothNumber = MINIMUM_GEAR_TEETH;
        }
        if (data.radius < MINIMUM_GEAR_RADIUS) {
            addAlert ( `Rounded to minmum radius  (${MINIMUM_GEAR_RADIUS*scale}, ${MINIMUM_GEAR_RADIUS}px)`, 'warning');
            data.radius = MINIMUM_GEAR_RADIUS;
        }
        if (data.module < MINIMUM_GEAR_MODULE) {
            addAlert ( `Rounded to minmum module  (${MINIMUM_GEAR_MODULE*scale} at this scale)`, 'warning');
            data.module = MINIMUM_GEAR_MODULE;
        }
        

        // changed changed values
        let changedToothNum = data.toothNumber !== gear.toothNumber;
        let changedModule = Math.abs(data.module - gear.module) > 0.01;
        let changedRadius = Math.abs(data.radius - gear.r) > 0.01;
        
        // change options
        if (changedToothNum && changedRadius && changedModule && Math.abs(data.radius / data.toothNumber - data.module) > 0.01) {
            addAlert ("Given values of tooth number, radius, and module are not correct (module !== radius/toothNum)", 'error')
            return;
        }

        // modify tooth number
        if (changedToothNum && !changedRadius) {
            gear.toothNumber = data.toothNumber;
            gear.r = data.module * data.toothNumber;
            gear.module = data.module;
        }
        if (changedToothNum && changedRadius) {
            gear.toothNumber = data.toothNumber;
            gear.r = data.radius;
            gear.module = Math.round(data.radius / data.toothNumber*1000)/1000;
        }

        // modify radius
        if (changedRadius && !changedToothNum) {
            gear.r = data.radius;
            gear.toothNumber = Math.max(Math.round(data.radius / data.module), MINIMUM_GEAR_TEETH);
            gear.module = Math.round(gear.r / gear.toothNumber * 1000)/1000;

            if (Math.abs(gear.module - data.module) > 0.01 ) {
                addAlert( "after calculating tooth number module was modified", 'warning');
            }
        }

        //modyfy module
        if (changedModule && !changedRadius && !changedToothNum) {
            gear.module = data.module;
            gear.r = data.module * gear.toothNumber;
        }

        let revert = false;
        if (gear.toothNumber < MINIMUM_GEAR_TEETH) {
            addAlert (`After calculation minimum tooth number exceeded (${MINIMUM_GEAR_TEETH})`, 'warning');
            revert = true;
        }
        if (gear.r < MINIMUM_GEAR_RADIUS) {
            addAlert ( `After calculation minimum radius exceeded  (${MINIMUM_GEAR_RADIUS*scale}, ${MINIMUM_GEAR_RADIUS}px)`, 'warning');
            revert = true;
        }
        if (gear.module < MINIMUM_GEAR_MODULE) {
            addAlert ( `After calculation minimum module exceeded  (${MINIMUM_GEAR_MODULE * scale} at this scale)`, 'warning');
            revert = true;
        }
        if (revert) {
            addAlert ( `Gear modification reverted`, 'error');
            gear.toothNumber = beforeToothNum;
            gear.module = beforeModule;
            gear.r = beforeRadius;
        }

        
        // if parameters change do animation
        if (changedToothNum || changedRadius) {
            gear.startInitalizationAnimation(performance.now());
        }
        
        // 3. Obsługa błędów modułu (Sąsiedzi)
        let warning = "";
        if (prev && Math.abs(prev.module - gear.module) > 0.05) {
            gear.setTethered(true, false);
            prev.setTethered(true, true);
            warning = "Module mismatch with previous gear! Tether forced.";
        }
        if (next && Math.abs(next.module - gear.module) > 0.05) {
            next.setTethered(true, false);
            gear.setTethered(true, true);
            warning = "Module mismatch with next gear! Tether forced.";
        }

        if (warning) addAlert(warning, 'warning');

        // update speeds
        if (Math.abs(data.speed - gear.rotationSpeed) > 0.01) {
            speedOriginGearIndexRef.current = index;
            speedOriginValueRef.current = data.speed;
        } 
        
        recalculateSpeeds();
        recalculatePositions();
        realignGears();
        forceUpdate();
        setEditMode(revert);
    };

    const addAlert = (message, type = 'warning') => {
        const id = Date.now() + Math.random();
        setAlerts(prev => [...prev, { id, message, type }]);
    };

    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    /* Initialization */
    useEffect(() => {
        const handleResize = () => {
            if(canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setCanvasWidth(rect.width);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        if (gearsRef.current.length === 0) {
            const canvasWidth = canvasRef.current.getBoundingClientRect().width;
            const initialRadius = Math.max(60,Math.round(canvasWidth*INITIAL_GEAR_Radius_MULTIPLIER/60)*60);
            const startX = canvasWidth * GEAR_CHAIN_POSITION_X_MULTIPLIER;
            const startY = initialRadius * GEAR_CHAIN_POSITION_Y_MULTIPLIER;
            
            const g1 = new Gear(startX, startY, initialRadius, 16, generateRandomColour(), null);
            gearsRef.current.push(g1);
            
            // Dodajmy kilka startowych
            addNewGear(8);
            addNewGear(16);
            addNewGear(4);
            
            recalculateSpeeds();
            recalculatePositions();
            forceUpdate(); // Odśwież UI
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [addNewGear, recalculatePositions]);

    // render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let rafId;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);
        setCanvasWidth(rect.width*dpr);

        const loop = () => {
            ctx.clearRect(0, 0, rect.width, canvasHeight);            
            const gears = gearsRef.current;

            for (let i=0; i<gears.length; i++){
                let g = gears[i];
                g.rotate(0.02);
                g.animate(performance.now());
                drawGear(ctx,g);
                if (i>0) drawGearLinkage(ctx,g,gears[i-1], maxElementOffsetX);
            }

            rafId = requestAnimationFrame(loop);
        };
        
        loop();
        return () => cancelAnimationFrame(rafId);
    }, [canvasHeight, version, maxElementOffsetX]);

    const controls = useMemo(() => { 
        const btns = [];
        const gears = gearsRef.current;
        
        for (let i = 0; i < gears.length - 1; i++) {
            const g1 = gears[i];
            const g2 = gears[i + 1];
            
            // Środek między zębatkami dla przycisków
            const midY = (g1.y + g1.r + g2.y - g2.r) / 2; 
            const midX = g1.x + Math.min(Math.max(g1.r, g2.r) * CONNECTOR_OFFSET_MULTIPLIER, maxElementOffsetX); // Odsunięcie w prawo

            btns.push({
                top: midY,
                left: midX,
                index: i
            });
        }
        return btns;
    }, [version, maxElementOffsetX]);

    return (
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <AlertsContainer alerts={alerts} onDismiss={removeAlert} />
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: `${canvasHeight}px`, display: 'block' }}
            />

            {/* Linage control buttons */}
            {controls.map((pos, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    gap: '15px',
                }}>
                    {/* Przycisk Tether (0) */}
                    <ControlButton 
                        label="I"
                        onClick={() => handleTether(pos.index)}
                        hoverColor={'darkblue'} // Czerwony kolor przy najechaniu
                        defaultColour={CONNECTOR_COLOUR}
                        tooltipText={gearsRef.current[pos.index].isTetheredAfter ? "Untether" : "Tether gears together"}
                        />

                    {/* Przycisk Dodaj (+) */}
                    <ControlButton 
                        label="+"
                        onClick={() => handleAddGear(pos.index)}
                        defaultColour={CONNECTOR_COLOUR}
                        hoverColor={'darkgreen'} // Zielony kolor przy najechaniu
                        tooltipText="Add gear in-between"
                    />
                </div>
            ))}

            {/* right Gear control buttons */}
            {gearsRef.current.map((g, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: g.y,
                    left: g.x + maxElementOffsetX + 20,
                    transform: 'translate(0, -50%)',
                    display: 'flex',
                    gap: '15px',
                    padding: '0.5em',
                    border: `1px solid ${setHslaAlpha(g.colour,.5)}`, borderRadius: 10,
                }}>
                    {/* Remove gear button */}
                    { i !== 0 ? (
                        <ControlButton 
                            label="-"
                            defaultColour={CONNECTOR_COLOUR}
                            onClick={() => handleRemoveGear(i)}
                            hoverColor={'darkred'} // Zielony kolor przy najechaniu
                            tooltipText="Remove this gear"
                        />
                    ) : (null)}
                    {/* Edit gear button */}
                    <ControlButton 
                        label="/"
                        onClick={() => {
                            setEditMode (!editingMode || editableGearIndex !== i);
                            setEditableGearIndex (i);
                        }}
                        defaultColour={CONNECTOR_COLOUR}
                        hoverColor={'darkblue'} // Czerwony kolor przy najechaniu
                        tooltipText={"Edit gear parameters"}
                    />
                </div>
            ))}

            {/* left Gear info panels */}
            {gearsRef.current.map((g, i) => {
                // --- calculate sized with custom (user providede) scale, referenced off gear nr1 size  ---
                const firstGearPixelR = gearsRef.current[0].r;
                const sizeMultiplier = displayMode;
                const scale = (userScale/sizeMultiplier) / firstGearPixelR;

                return (
                <div key={i} style={{
                    paddingLeft: '1em',
                    paddingRight: '1em',
                    fontSize: 'medium',
                    padding: '.3em',
                    border: `2px solid ${setHslaAlpha(g.colour,.35)}`, borderRadius: 10,
                    position: 'absolute', left: g.x-maxElementOffsetX-30, top: g.y,
                    transform: 'translate(-75%, -50%)',
                    display: 'flex', flexDirection: 'row',
                    backgroundColor: CONTROLS_BACKGROUND_COLOUR,
                }}>
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {/* Wyświetlamy przeskalowane wartości */}
                        <div>{displayMode === 2 ? '⌀' : 'r'} {Math.round(g.r*scale*sizeMultiplier*100)/100}</div>
                        <div>z {g.toothNumber}</div>
                        <div>m {Math.round(g.module*scale*1000*2)/1000}</div>
                        <div> -------- </div>
                        <div>v {Math.round(g.rotationSpeed*100)/100}</div>
                    </div>
                    
                    { editingMode && editableGearIndex === i ? (
                    <div style={{display: 'flex', flexDirection: 'column', maxWidth:'10em', marginLeft:'1em', gap: '4px'}}> 
                        <GearEditForm gear={g} index={i} onApply={handleApplyEdit} scale={scale} sizeMultiplier={sizeMultiplier}/>
                    </div>
                    ) : ( null ) }
                </div>
            )})}

            {/* ADD NEW AT BOTTOM */}
            {gearsRef.current.length > 0 && (() => {
                const last = gearsRef.current[gearsRef.current.length-1];
                return (
                    <div style={{
                        position: 'absolute',
                        top: last.y + last.r + 40, // Pod ostatnią zębatką
                        left: last.x,
                        transform: 'translate(-50%, -50%)'
                    }}>
                        <ControlButton 
                            label="+" 
                            onClick={() => addNewGear(16)} // Domyślnie 16 zębów
                            defaultColour={CONNECTOR_COLOUR}
                            hoverColor="green"
                            tooltipText="Add new gear"
                        />
                    </div>
                )
            })()}
        </div>
    );
}