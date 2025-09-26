import Color from "colorjs.io";

class VHCSetGame {
    constructor() {
        this.cards = [];
        this.selectedCards = [];
        this.gameStartTime = 0;
        this.timerInterval = null;
        this.colorFineness = 1;
        this.gameStats = [];
        this.currentRound = 0;
        this.totalMatches = 0;
        this.gridSize = 3;
        this.sessionId = this.generateSessionId();
        this.backendUrl = null; // Will be set when backend is specified
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadStats();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.controls = document.getElementById('controls');
        this.gameArea = document.getElementById('gameArea');
        this.cardsContainer = document.getElementById('cardsContainer');
        this.timerLine = document.getElementById('timerLine');
        this.timerText = document.getElementById('timerText');
        this.passBtn = document.getElementById('passBtn');
        this.quitBtn = document.getElementById('quitBtn');
	this.errorX = document.getElementById('errorX');
	this.matchNotice = document.getElementById('matchNotice');
	
	this.gridSizeSlider = document.getElementById('gridSizeSlider');
	this.colorFinenessSlider = document.getElementById('colorFinenessSlider');

	this.gridSizeText = document.getElementById('gridSizeText');
	this.colorFinenessText = document.getElementById('colorFinenessText');

	this.gameOver = document.getElementById('gameOver');
        this.stats = document.getElementById('stats');
        this.scoreScreen = document.getElementById('scoreScreen');
        this.achievementName = document.getElementById('achievementName');
        this.scoreDetails = document.getElementById('scoreDetails');
        this.finalScore = document.getElementById('finalScore');
        this.matchCount = document.getElementById('matchCount');
        this.avgTime = document.getElementById('avgTime');
        this.gridSizeDisplay = document.getElementById('gridSizeDisplay');
        this.continueBtn = document.getElementById('continueBtn');

	this.lMin = 0.2;
	this.lMax = 0.9;

	this.hMin = 0;
	this.hMax = 360;
	
	this.cMin = 0.0;
	this.cMax = 0.4;
	
	this.ls = null;
	this.hs = null;
	this.cs = null;

	this.gameAreaSizePx = 500;
	this.cardGap = 20;
	
    }

    populateColorCyl() {
	let lRange = this.lMax - this.lMin;
	let lDiffScale = 5;
	let lStep = lRange/(lDiffScale*this.colorFineness);
	let nLSteps = Math.floor((lRange/lStep) + 1); 

	//console.log(`lRange: ${lRange}, lStep: ${lStep}, nLSteps: ${nLSteps}, colorFineness: ${this.colorFineness}`);
	this.ls = new Array(nLSteps);
	this.ls[0] = this.lMin;
	
	for(let i=1; i<nLSteps; i++) {
	    this.ls[i]=this.ls[i-1] + lStep;
	}
	this.ls[this.ls.length-1] = Math.min(this.lMax, this.ls.at(-1));

	//console.log(`vs: ${this.ls}`);
	
	let hRange = this.hMax - this.hMin;
	let hDiffScale = 8;
	let hStep = hRange/(hDiffScale*this.colorFineness);
	let nHSteps = Math.floor((hRange/hStep));

	this.hs = new Array(nHSteps);
	this.hs[0] = this.hMin;

	for(let i=1; i<nHSteps; i++) {
	    this.hs[i]=this.hs[i-1] + hStep;
	}
	this.hs[this.hs.length-1] = Math.min(this.hMax, this.hs.at(-1));
	
	//console.log(`hRange: ${hRange}, hStep: ${hStep}, nHSteps: ${nHSteps}, colorFineness: ${this.colorFineness}`);
	//console.log(`hs: ${this.hs}`);

	let cRange = this.cMax - this.cMin;
	let cDiffScale = 5;
	let cStep = cRange/(cDiffScale*this.colorFineness);
	let nCSteps = Math.floor((cRange/cStep)+1);

	this.cs = new Array(nCSteps);
	this.cs[0] = this.cMin;

	for(let i=1; i<nCSteps; i++) {
	    this.cs[i]=this.cs[i-1] + cStep;
	}
	this.cs[this.cs.length-1] = Math.min(this.cMax, this.cs.at(-1));
	
	//console.log(`cRange: ${cRange}, cStep: ${cStep}, nCSteps: ${nCSteps}, colorFineness: ${this.colorFineness}`);
	//console.log(`cs: ${this.cs}`);

    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.passBtn.addEventListener('click', () => this.handlePass());
        this.quitBtn.addEventListener('click', () => this.quitGame());
        this.continueBtn.addEventListener('click', () => this.hideScoreScreen());

	this.gridSizeSlider.addEventListener('input', (e) => {
	    this.gridSize = parseInt(e.target.value);
	    this.gridSizeText.textContent=`${this.gridSize}x${this.gridSize}`;
	});

	this.colorFinenessSlider.addEventListener('input', (e) => {
	    this.colorFineness = parseInt(e.target.value);
	    this.colorFinenessText.textContent = `${this.colorFineness}`;
	    this.populateColorCyl();
	});
	
    }

    generateRandomColor() {
	//Sample the color cylinder until we are inside sRGB
	var isColInside=false;
	var color = null;

	while(!isColInside) {
	    let li = Math.floor(Math.random() * this.ls.length);
	    let hi = Math.floor(Math.random() * this.hs.length);
	    let ci = Math.floor(Math.random() * this.cs.length);

	    let l = this.ls[li];
	    let h = this.hs[hi];
	    let c = this.cs[ci];

	    if(c == 0.0) {
		h=0.0;
	    }
	    color = new Color("oklch", [l, c, h]);

	    if(color.inGamut("srgb")) {
		isColInside=true;
	    }
	}
        return color;
    }

    colorToRGBString(color) {
	//console.log(`Color ${color}`);
	const rgb = color.to("srgb");
	var retval = `rgb(${Math.round(rgb.r*255)}, ${Math.round(rgb.g*255)}, ${Math.round(rgb.b*255)})`;
	return(retval);
    }
    
    createCard(color, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.hue = color.h.toString();
        card.dataset.chroma = color.c.toString();
        card.dataset.lightness = color.l.toString();

        card.style.backgroundColor = this.colorToRGBString(color);
        
        // Set size based on current grid
        const cardSize = Math.max(40, 580 / this.gridSize - 20);
        card.style.width = cardSize + 'px';
        card.style.height = cardSize + 'px';
        
        card.addEventListener('click', () => this.selectCard(card));
        return card;
    }

    selectCard(card) {
        if (card.classList.contains('matched')) {
            return;
        }

        // If card is already selected, deselect it
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            const index = this.selectedCards.indexOf(card);
            if (index > -1) {
                this.selectedCards.splice(index, 1);
            }
            return;
        }

        card.classList.add('selected');
        this.selectedCards.push(card);

	//console.log(`LCH: (${card.dataset.lightness}, ${card.dataset.chroma}, ${card.dataset.hue})`);

        if (this.selectedCards.length === 3) {
            this.checkMatch();
        }
    }

    checkMatch() {
        const cards = this.selectedCards;
        const hues = cards.map(c => parseFloat(c.dataset.hue));
        const saturations = cards.map(c => parseFloat(c.dataset.chroma));
        const lightnesses = cards.map(c => parseFloat(c.dataset.lightness));

        const sameLightness = lightnesses[0] === lightnesses[1] && lightnesses[1] === lightnesses[2];
        const sameSaturation = saturations[0] === saturations[1] && saturations[1] === saturations[2];
	const sameHue = hues[0] === hues[1] && hues[1] === hues[2] && !sameSaturation;


        const isMatch = sameHue || sameSaturation || sameLightness;

        if (isMatch) {
            this.handleMatch(sameLightness,sameHue,sameSaturation);
        } else {
            this.handleMismatch();
        }
    }

    handleMatch(lMatch, hMatch, cMatch) {
	var matchMessages=[];
	
	if(lMatch) {
	    matchMessages.push("Matched value!");
	}

	if(hMatch) {
	    matchMessages.push("Matched hue!");
	}

	if(cMatch) {
	    matchMessages.push("Matched chroma!");
	}

	var i=0, mmShowStep=800;
	
	for(const mm of matchMessages) {
	    //console.log(`${mm}`);

	    setTimeout(() => {
		this.matchNotice.textContent = mm;
		this.matchNotice.classList.add('show');
	    },i);
	    
	    setTimeout(() => {
		this.matchNotice.classList.remove('show');
	    }, i+mmShowStep);

	    i=i+mmShowStep/2;
	}

        const matchTime = (Date.now() - this.gameStartTime) / 1000;
        const matchData = {
            sessionId: this.sessionId,
            round: this.currentRound,
            matchTime: matchTime,
            colorFineness: this.colorFineness,
            gridSize: this.gridSize,
            timestamp: new Date().toISOString(),
            matchedCards: this.selectedCards.map(card => ({
                hue: parseFloat(card.dataset.hue),
                chroma: parseFloat(card.dataset.chroma),
                lightness: parseFloat(card.dataset.lightness)
            })),
            matchType: this.getMatchType(this.selectedCards),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`
        };

        this.gameStats.push(matchData);

        this.selectedCards.forEach(card => {
            card.style.animation = 'crossFade 0.6s ease-in-out';
            setTimeout(() => {
                // Generate new color
                const newColor = this.generateRandomColor();
                card.style.backgroundColor = this.colorToRGBString(newColor);
                card.dataset.hue = newColor.h.toString();
                card.dataset.chroma = newColor.c.toString();
                card.dataset.lightness = newColor.l.toString();
                card.classList.remove('selected');
                card.style.animation = '';
            }, 300);
        });

        this.selectedCards = [];
        this.currentRound++;
        this.totalMatches++;
        this.gameStartTime = Date.now(); // Reset timer for next match
        this.saveStats();
        //this.uploadMatchData(matchData);
        this.updateStats();
    }

    getMatchType(cards) {
        const hues = cards.map(c => parseFloat(c.dataset.hue));
        const saturations = cards.map(c => parseFloat(c.dataset.chroma));
        const lightnesses = cards.map(c => parseFloat(c.dataset.lightness));

        if (hues[0] === hues[1] && hues[1] === hues[2]) return 'hue';
        if (saturations[0] === saturations[1] && saturations[1] === saturations[2]) return 'saturation';
        if (lightnesses[0] === lightnesses[1] && lightnesses[1] === lightnesses[2]) return 'lightness';
        return 'unknown';
    }

    handleMismatch() {
        // Show error X
        this.errorX.classList.add('show');
        setTimeout(() => {
            this.errorX.classList.remove('show');
        }, 400);

        // Deselect cards
        this.selectedCards.forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedCards = [];
    }

    handlePass() {
        // Clear any selected cards first
        this.selectedCards.forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedCards = [];

        // Check if there's actually a match available
        const hasMatch = this.checkForAvailableMatch();
        
        if (hasMatch) {
            // Show error X if there was a match they missed
            this.errorX.classList.add('show');
            setTimeout(() => {
                this.errorX.classList.remove('show');
            }, 400);
        } else {
            // If no match available, generate new cards
            this.generateNewCards();
        }
    }

    checkForAvailableMatch() {
        const cards = Array.from(this.cardsContainer.children);
        
        // Check all possible combinations of 3 cards
        for (let i = 0; i < cards.length - 2; i++) {
            for (let j = i + 1; j < cards.length - 1; j++) {
                for (let k = j + 1; k < cards.length; k++) {
                    const card1 = cards[i];
                    const card2 = cards[j];
                    const card3 = cards[k];
                    
                    if (card1.classList.contains('matched') || 
                        card2.classList.contains('matched') || 
                        card3.classList.contains('matched')) {
                        continue;
                    }
                    
                    const hues = [card1, card2, card3].map(c => parseFloat(c.dataset.hue));
                    const saturations = [card1, card2, card3].map(c => parseFloat(c.dataset.chroma));
                    const lightnesses = [card1, card2, card3].map(c => parseFloat(c.dataset.lightness));

                    const sameHue = hues[0] === hues[1] && hues[1] === hues[2];
                    const sameSaturation = saturations[0] === saturations[1] && saturations[1] === saturations[2];
                    const sameLightness = lightnesses[0] === lightnesses[1] && lightnesses[1] === lightnesses[2];

                    if (sameHue || sameSaturation || sameLightness) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    generateNewCards() {
        const cards = Array.from(this.cardsContainer.children);
        cards.forEach(card => {
            if (!card.classList.contains('matched')) {
                card.style.animation = 'crossFade 0.6s ease-in-out';
                setTimeout(() => {
                    const newColor = this.generateRandomColor();
                    card.style.backgroundColor = this.colorToRGBString(newColor);
                    card.dataset.hue = newColor.h.toString();
                    card.dataset.chroma = newColor.s.toString();
                    card.dataset.lightness = newColor.l.toString();
                    card.style.animation = '';
                }, 300);
            }
        });
        
        // Reset timer
        this.gameStartTime = Date.now();
    }

    quitGame() {
        this.showScoreScreen();
    }

    showScoreScreen() {
        const score = this.calculateScore();
        const achievement = this.getAchievement(score);
        const avgTime = this.gameStats.length > 0 ? 
              this.gameStats.reduce((sum, s) => sum + s.matchTime, 0) / this.gameStats.length : 0;

        this.achievementName.textContent = achievement.name;
        this.finalScore.textContent = score.toFixed(0);
        this.matchCount.textContent = this.gameStats.length;
        this.avgTime.textContent = avgTime.toFixed(1) + 's';
        this.gridSizeDisplay.textContent = `${this.gridSize}x${this.gridSize}`;
        
        this.scoreDetails.innerHTML = `
                    <p>${achievement.description}</p>
                    <p>Score: <span>${score.toFixed(0)}</span></p>
                    <p>Matches: <span>${this.gameStats.length}</span> | Avg Time: <span>${avgTime.toFixed(1)}s</span></p>
                    <p>Grid Size: <span>${this.gridSize}x${this.gridSize}</span></p>
                `;

        this.scoreScreen.style.display = 'flex';
    }

    hideScoreScreen() {
        this.scoreScreen.style.display = 'none';
        this.reset();
    }

    calculateScore() {
        if (this.gameStats.length === 0) return 0;
        
        const avgTime = this.gameStats.reduce((sum, s) => sum + s.matchTime, 0) / this.gameStats.length;
        const colorFinenessMultiplier = Math.pow(this.colorFineness, 1.5);
        const speedBonus = Math.max(1, 10 / avgTime); // Better score for faster times
        const consistencyBonus = this.gameStats.length > 1 ? 
              Math.max(0.5, 2 - (Math.max(...this.gameStats.map(s => s.matchTime)) - Math.min(...this.gameStats.map(s => s.matchTime)))) : 1;
        
        return (this.gameStats.length * colorFinenessMultiplier * speedBonus * consistencyBonus);
    }

    getAchievement(score) {
        const achievements = [
            // Motivational starting levels
            { threshold: 0, name: "Spectral Seedling", description: "Every master of color started with a single hue. Your journey begins!" },
            { threshold: 5, name: "Chromatic Curious", description: "You're beginning to see the light! Keep exploring the color space." },
            
            // Beginner achievements
            { threshold: 15, name: "RGB Rookie", description: "You're getting the hang of this color business!" },
            { threshold: 25, name: "Hue Hunter", description: "You're tracking down those matching hues like a pro!" },
            { threshold: 40, name: "Saturation Seeker", description: "Your eyes are becoming more discerning!" },
            { threshold: 60, name: "Lightness Detective", description: "You're illuminating the mysteries of color!" },
            
            // Intermediate achievements
            { threshold: 85, name: "Color Coordinator", description: "Your chromatic organization skills are showing!" },
            { threshold: 120, name: "Wavelength Warrior", description: "You're fighting the good fight in the electromagnetic spectrum!" },
            { threshold: 160, name: "Prismatic Pioneer", description: "You're breaking light into its component parts like Newton!" },
            { threshold: 210, name: "Chroma Champion", description: "You're the master of color purity!" },
            { threshold: 270, name: "Gamut Guardian", description: "You know your way around the color space!" },
            
            // Advanced achievements
            { threshold: 340, name: "CIE Specialist", description: "You understand color like the International Commission on Illumination!" },
            { threshold: 420, name: "Lab Space Navigator", description: "You're cruising through perceptually uniform color space!" },
            { threshold: 510, name: "Delta E Expert", description: "You can spot the tiniest color differences!" },
            { threshold: 610, name: "Munsell Master", description: "You've got that artistic color system down pat!" },
            { threshold: 720, name: "Color Temperature Guru", description: "From cool to warm, you know your Kelvin scale!" },
            
            // Expert achievements
            { threshold: 840, name: "Metameric Marvel", description: "You understand that colors can match under some lights but not others!" },
            { threshold: 970, name: "Chromatic Adaptation Ace", description: "Your visual system adjusts to any lighting condition!" },
            { threshold: 1120, name: "LMS Cone Connoisseur", description: "You're working directly with your photoreceptors!" },
            { threshold: 1280, name: "Spectral Sensitivity Sage", description: "You know exactly how your eyes respond to light!" },
            { threshold: 1450, name: "Color Constancy Crusader", description: "Objects stay the same color regardless of lighting!" },
            
            // Master achievements
            { threshold: 1640, name: "Opponent Process Oracle", description: "You understand the red-green, blue-yellow neural pathways!" },
            { threshold: 1840, name: "Retinex Revolutionary", description: "You've mastered Land's theory of color vision!" },
            { threshold: 2060, name: "Photopic Prophet", description: "You see clearly in bright light conditions!" },
            { threshold: 2300, name: "Scotopic Sorcerer", description: "Even in dim light, your color vision is legendary!" },
            { threshold: 2560, name: "Mesopic Maestro", description: "You excel in that tricky twilight vision zone!" },
            
            // Legendary achievements
            { threshold: 2840, name: "Tetrachromat Candidate", description: "Wait... do you have a fourth type of color receptor?!" },
            { threshold: 3140, name: "Mantis Shrimp Apprentice", description: "Getting close to 12-16 different color receptors!" },
            { threshold: 3460, name: "Hyperspectral Human", description: "You see colors that don't even have names!" },
            { threshold: 3800, name: "Impossible Color Perceiver", description: "Reddish green? Yellowish blue? You've transcended physics!" },
            { threshold: 4160, name: "Quantum Color Theorist", description: "You understand color at the photon level!" },
            { threshold: 4540, name: "Electromagnetic Enlightened", description: "The entire spectrum bends to your will!" },
            { threshold: 4940, name: "Planck's Color Constant", description: "You're a fundamental constant of color perception!" },
            { threshold: 5360, name: "Chromodynamic Legend", description: "You've achieved color vision singularity!" },
            { threshold: 5800, name: "The Visible Light Whisperer", description: "Photons tell you their deepest secrets!" },
            { threshold: 6260, name: "Newton's Nightmare", description: "You've surpassed the master of optics himself!" }
        ];

        // Find the highest threshold the score meets
        for (let i = achievements.length - 1; i >= 0; i--) {
            if (score >= achievements[i].threshold) {
                return achievements[i];
            }
        }
        
        return achievements[0]; // Fallback to first achievement
    }

    startGame() {
        this.controls.style.display = 'none';
        this.gameArea.style.display = 'block';
        this.gameOver.style.display = 'none';
        this.cards = [];
        this.selectedCards = [];
        this.currentRound = 0;
        this.totalMatches = 0;
        this.gameStats = [];
        
        this.setupGrid();
        this.cardsContainer.innerHTML = '';

	this.populateColorCyl();
        // Create cards based on grid size
        const totalCards = this.gridSize * this.gridSize;
        for (let i = 0; i < totalCards; i++) {
            const color = this.generateRandomColor();

	    //console.log(`${color}`);
	    
            const card = this.createCard(color, i);
            this.cards.push(card);
            this.cardsContainer.appendChild(card);
            
            // Stagger the fade-in animation
            setTimeout(() => {
                card.classList.add('visible');
            }, i * 50);
        }

        this.gameStartTime = Date.now();
        this.startTimer();
    }

    setupGrid() {
        const cardSize = Math.max(40, 580 / this.gridSize - 20); // Minimum 40px, scaled to fit
        const gap = Math.max(10, 20 - this.gridSize); // Smaller gaps for larger grids
        
        this.cardsContainer.style.gridTemplateColumns = `repeat(${this.gridSize}, ${cardSize}px)`;
        this.cardsContainer.style.gridTemplateRows = `repeat(${this.gridSize}, ${cardSize}px)`;
        this.cardsContainer.style.gap = `${gap}px`;
        
        // Update card size in CSS
        const cards = this.cardsContainer.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.width = cardSize + 'px';
            card.style.height = cardSize + 'px';
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.gameStartTime) / 1000;
            const maxWidth = 450; // Adjusted for new timer container width
            const width = Math.min((elapsed / 30) * maxWidth, maxWidth); // 30 seconds max width
            
            this.timerLine.style.width = width + 'px';
            this.timerText.textContent = elapsed.toFixed(1) + 's';
        }, 100);
    }

    saveStats() {
        const allStats = JSON.parse(localStorage.getItem('setStats') || '[]');
        allStats.push(...this.gameStats);
        localStorage.setItem('setStats', JSON.stringify(allStats));
    }

    loadStats() {
        const allStats = JSON.parse(localStorage.getItem('setStats') || '[]');
        this.updateStats(allStats);
    }

    updateStats(allStats = null) {
        const stats = allStats || JSON.parse(localStorage.getItem('setStats') || '[]');
        if (stats.length === 0) {
            this.stats.innerHTML = '';
            return;
        }

        const avgTime = stats.reduce((sum, s) => sum + s.matchTime, 0) / stats.length;
        const bestTime = Math.min(...stats.map(s => s.matchTime));
        const gamesPlayed = stats.length;

        this.stats.innerHTML = `
                    <div>Games: ${gamesPlayed} | Avg: ${avgTime.toFixed(1)}s | Best: ${bestTime.toFixed(1)}s</div>
                `;
    }

    reset() {
        clearInterval(this.timerInterval);
        this.controls.style.display = 'block';
        this.gameArea.style.display = 'none';
        this.timerLine.style.width = '0px';
        this.timerText.textContent = '0.0s';
        this.updateStats();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new VHCSetGame();
    
    // Add reset functionality
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            game.reset();
        }
    });
});
