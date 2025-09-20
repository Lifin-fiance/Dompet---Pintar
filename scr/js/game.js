// --- INITIAL GAME STATE ---
const getInitialState = () => ({
    // Core Stats
    age: 5,
    intelligence: 10,
    health: 100,
    money: 2000000, // Uang saku awal
    fun: 50,
    relationships: 50,
    energy: 100,
    // Life Stage & Career
    stage: 'Kindergarten',
    career: null,
    careerLevel: 0,
    // New System States
    hasPartner: false,
    isMarried: false,
    children: [], 
    assets: [], 
    gamblingStreak: 0,
    gamblingAddiction: false,
    fitnessLevel: 0,
    dietQuality: 0, // from -50 to +50
    // Flags for events/choices
    hasMajored: false,
    flags: {}
});

let gameState = getInitialState();
let gameData = {};

// --- DOM ELEMENTS ---
const elements = {
    statsContainer: document.getElementById('stats'),
    actions: document.getElementById('action-buttons'),
    nextYearBtn: document.getElementById('nextYearBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    gameOverScreen: document.getElementById('game-over'),
    gameContainer: document.getElementById('game-container'),
    summary: document.getElementById('summary'),
    messageBox: document.getElementById('message-box'),
    stageImage: document.getElementById('stage-image'),
    stageName: document.getElementById('stage-name'),
    statusDisplay: document.getElementById('status-display'),
    financialSummaryDisplay: document.createElement('div'),
};
elements.statusDisplay.after(elements.financialSummaryDisplay);
elements.financialSummaryDisplay.id = 'financial-summary'; // Added for easier CSS targeting
elements.financialSummaryDisplay.className = 'mt-4 text-left space-y-1';


// --- HELPER FUNCTIONS ---
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

function showMessage(text, type = 'info') {
    elements.messageBox.textContent = text;
    elements.messageBox.classList.remove('bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-gray-100', 'text-gray-700');
    
    const typeClasses = {
        error: ['bg-red-100', 'text-red-700'],
        success: ['bg-green-100', 'text-green-700'],
        info: ['bg-gray-100', 'text-gray-700']
    };
    elements.messageBox.classList.add(...(typeClasses[type] || typeClasses.info));
    
    elements.messageBox.style.opacity = '1';
    elements.messageBox.style.transform = 'translateY(0)';

    setTimeout(() => {
        elements.messageBox.style.opacity = '0';
        elements.messageBox.style.transform = 'translateY(-10px)';
    }, 4000);
}

// --- ACTION HANDLERS ---

const actionHandlers = {
    goToGym: () => {
        const cost = 200000;
        const energyCost = 30;
        if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("Kamu tidak punya cukup uang atau energi.", "error");
            return;
        }
        showMessage("Kamu merasa berenergi dan lebih kuat setelah berolahraga.");
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            health: gameState.health + 10,
            fun: gameState.fun + 5,
            fitnessLevel: gameState.fitnessLevel + 1
        });
    },
    eatJunkFood: () => {
        const cost = 50000;
        const energyCost = 15;
         if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("Kamu tidak mampu membelinya saat ini.", "error");
            return;
        }
        showMessage("Sangat berminyak, tapi sangat enak. Kamu merasakan kepuasan.");
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            health: gameState.health - 5,
            fun: gameState.fun + 10,
            dietQuality: gameState.dietQuality - 2
        });
    },
    takeVacation: () => {
        const cost = 10000000;
        const energyCost = 10;
        if (gameState.money < cost) {
            showMessage("Kamu tidak mampu berlibur saat ini.", "error");
            return;
        }
        showMessage("Kamu kembali dari perjalanan dengan perasaan segar dan terhubung kembali dengan dunia.");
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            fun: gameState.fun + 40,
            relationships: gameState.relationships + 20,
            health: gameState.health + 5
        });
    },
    gamble: () => {
        const cost = 500000;
        const energyCost = 20;
        if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("Kamu tidak mampu pergi ke kasino.", "error");
            return;
        }

        let updates = {
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            gamblingStreak: gameState.gamblingStreak + 1
        };

        const roll = Math.random();
        if (roll < 0.05) { // Jackpot
            updates.money += 10000000;
            updates.fun += 20;
            showMessage("Kamu dapat jackpot! Lampu yang berkedip dan lonceng yang berbunyi sangat menggembirakan!", "success");
        } else if (roll < 0.25) { // Small Win
            updates.money += 1500000;
            updates.fun += 10;
            showMessage("Kamu pergi dengan membawa lebih dari yang kamu bawa. Malam yang sukses!", "success");
        } else if (roll < 0.50) { // Break Even
            updates.money += 500000;
            updates.fun -= 5;
            showMessage("Kamu tidak menang, kamu tidak kalah. Sensasinya hanya sesaat.");
        } else { // Loss
            updates.fun -= 10;
            updates.health -= 5;
            showMessage("Bandar selalu menang. Kamu pulang dengan kantong kosong dan hati yang berat.", "error");
        }
        
        if(updates.gamblingStreak > 5) {
            updates.gamblingAddiction = true;
        }

        updateGameState(updates);
    },
    tryToFindLove: () => {
         if (gameState.energy < 40) {
            showMessage("Kamu terlalu lelah untuk bersosialisasi saat ini.", "error");
            return;
        }
        let updates = {...gameState, energy: gameState.energy - 40};
        if(gameState.relationships > 50) {
            updates.hasPartner = true;
            showMessage("Kamu telah bertemu seseorang yang spesial! Hidupmu terasa sedikit lebih cerah.", "success");
        } else {
            showMessage("Kamu mencoba, tetapi tidak terhubung dengan siapa pun kali ini.");
        }
        updateGameState(updates);
        updateActions();
    },
    propose: () => {
        const cost = 20000000;
        if (gameState.money < cost || gameState.energy < 20) {
            showMessage("Kamu butuh lebih banyak uang atau energi untuk melamar!", "error");
            return;
        }
        let updates = {...gameState, money: gameState.money - cost, energy: gameState.energy - 20};
        if(gameState.relationships > 70) {
            updates.isMarried = true;
            updates.hasPartner = false;
            updates.relationships += 20;
            updates.fun += 20;
            showMessage("Dia bilang ya! Kamu memulai babak baru dalam hidup bersama.", "success");
        } else {
            updates.hasPartner = false;
            updates.relationships -= 30;
            updates.fun -= 20;
            showMessage("Dia belum siap untuk langkah itu. Hubungan berakhir.", "error");
        }
        updateGameState(updates);
        updateActions();
    },
    divorce: () => {
        if (gameState.energy < 80) {
            showMessage("Kamu tidak punya energi untuk ini sekarang.", "error");
            return;
        }
        showMessage("Akhir yang menyakitkan untuk sebuah bab. Kamu sekarang sendirian lagi, dan itu sangat berat.", "error");
        updateGameState({
            ...gameState,
            isMarried: false,
            money: gameState.money * 0.5,
            energy: gameState.energy - 80,
            relationships: gameState.relationships - 50,
            fun: gameState.fun - 40,
            health: gameState.health - 10
        });
        updateActions();
    },
    haveChild: () => {
        const cost = 10000000;
        const energyCost = 60;
        if (gameState.money < cost || gameState.energy < energyCost) {
            showMessage("Kamu tidak punya energi finansial atau emosional untuk punya anak saat ini.", "error");
            return;
        }
        showMessage("Selamat datang di dunia, si kecil! Keluargamu telah bertambah.", "success");
        const newChildren = [...gameState.children, { age: 0 }];
        updateGameState({
            ...gameState,
            money: gameState.money - cost,
            energy: gameState.energy - energyCost,
            fun: gameState.fun + 20,
            relationships: gameState.relationships + 10,
            children: newChildren
        });
        updateActions();
    },
    buyAsset: (assetId) => {
        const asset = gameData.assets[assetId];
        if (!asset || gameState.money < asset.cost) {
            showMessage(`Kamu tidak mampu membeli ${asset.name}.`, "error");
            return;
        }

        let updates = {
            ...gameState,
            money: gameState.money - asset.cost
        };

        if (asset.type === 'housing') {
            updates.assets = gameState.assets.filter(id => gameData.assets[id].type !== 'housing');
        }
        
        updates.assets.push(assetId);
        
        for (const effect in asset.effect) {
            updates[effect] = (updates[effect] || 0) + asset.effect[effect];
        }

        showMessage(`Kamu telah membeli ${asset.name.replace(/^(Beli|Sewa) /i, '')}!`, "success");
        updateGameState(updates);
        updateActions();
    },
    findJob: () => {
        const availableCareers = Object.keys(gameData.careers).filter(careerName => {
            if (careerName === 'Unemployed' || careerName === gameState.career) return false;
            
            const careerData = gameData.careers[careerName];
            if (!careerData.levels?.length) return false;
    
            if (careerData.degreeRequired) {
                if (!gameState.flags.graduated || gameState.career !== careerData.degreeRequired) {
                    return false;
                }
            }
    
            const requirements = careerData.levels[0].requirements;
            for (const requirement in requirements) {
                if (gameState[requirement] < requirements[requirement]) {
                    return false;
                }
            }
            return true;
        });
    
        if (availableCareers.length > 0) {
            const newCareer = availableCareers[Math.floor(Math.random() * availableCareers.length)];
            const newCareerData = gameData.careers[newCareer];
            showMessage(`Selamat! Kamu telah dipekerjakan sebagai ${newCareerData.levels[0].title}!`, 'success');
            updateGameState({
                ...gameState,
                career: newCareer,
                careerLevel: 0,
                stage: 'Working Adult'
            });
            updateActions();
        } else {
            showMessage("Kamu mencari pekerjaan, tetapi belum menemukan yang sesuai dengan kualifikasimu.", 'info');
        }
    },
    seekPromotion: () => {
        if (!gameState.career || gameState.career === 'Unemployed') {
            showMessage("Kamu tidak punya karir untuk mendapatkan promosi.", "error");
            return;
        }

        const careerData = gameData.careers[gameState.career];
        const nextLevel = gameState.careerLevel + 1;

        if (!careerData.levels || nextLevel >= careerData.levels.length) {
            showMessage("Kamu sudah berada di puncak karirmu!", "info");
            return;
        }

        const promotionReqs = careerData.levels[nextLevel].requirements;
        const unmetRequirements = Object.keys(promotionReqs).filter(req => gameState[req] < promotionReqs[req]);

        if (unmetRequirements.length === 0) {
            const newTitle = careerData.levels[nextLevel].title;
            showMessage(`Selamat! Kamu telah dipromosikan menjadi ${newTitle}!`, 'success');
            updateGameState({
                ...gameState,
                careerLevel: nextLevel
            });
            updateActions();
        } else {
            const reqText = unmetRequirements.map(req => `${req.charAt(0).toUpperCase() + req.slice(1)}`).join(', ');
            showMessage(`Kamu tidak dipromosikan. Kamu perlu meningkatkan: ${reqText}.`, "error");
        }
    }
};

// --- STAT DISPLAY CONFIGURATION ---
const statConfig = [
    { name: 'Usia', key: 'age', color: 'cyan', icon: 'clock-hour.svg', format: val => val },
    { name: 'Kesehatan', key: 'health', color: 'red', icon: 'heart.svg', format: val => val },
    { name: 'Kecerdasan', key: 'intelligence', color: 'yellow', icon: 'intel.svg', format: val => val },
    { name: 'Hubungan', key: 'relationships', color: 'purple', icon: 'relation.svg', format: val => val },
    { name: 'Energi', key: 'energy', color: 'pink', icon: 'energy.svg', format: val => val },
    { name: 'Uang', key: 'money', color: 'blue', icon: 'money.svg', format: val => `Rp${new Intl.NumberFormat('id-ID').format(val)}` },
];


function setupStatDisplays() {
    elements.statsContainer.innerHTML = '';
    statConfig.forEach(stat => {
        const valueId = `stat-${stat.key}`;
        const statHTML = `
            <div class="relative flex flex-col items-center pt-[30px]">
                <div class="absolute top-0 z-10">
                    <div class="w-[60px] h-[60px] rounded-full bg-white flex items-center justify-center ">
                        <img src="scr/assets/images/${stat.icon}" alt="${stat.name}" class="w-[35px]">
                    </div>
                </div>

                <div id="container-${stat.key}" class="bg-${stat.color}-100 pt-[40px] pb-3 px-3 w-full h-full rounded-lg transition-all duration-500 text-center">
                    <div class="text-sm font-medium text-gray-700 mt-1">${stat.name}</div>
                    <div id="${valueId}" class="text-2xl font-bold text-gray-800"></div>
                </div>
            </div>
        `;
        elements.statsContainer.innerHTML += statHTML;
    });
}


function updateDisplay() {
    Object.keys(gameState).forEach(key => {
        if (['health', 'fun', 'intelligence', 'relationships', 'energy'].includes(key)) {
            gameState[key] = clamp(gameState[key], 0, 100);
        }
    });
    gameState.money = Math.max(0, Math.floor(gameState.money));

    statConfig.forEach(stat => {
        const statElement = document.getElementById(`stat-${stat.key}`);
        if (statElement) {
            const value = stat.format ? stat.format(gameState[stat.key]) : gameState[stat.key];
            statElement.textContent = value;
        }
    });

    const currentCareerData = gameData.careers[gameState.career];
    const currentStageData = gameData.stages[gameState.stage];
    
    if (gameState.stage === 'Retirement') {
        elements.stageImage.src = currentStageData?.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        elements.stageName.textContent = currentStageData?.displayName || gameState.stage;
    } else {
        elements.stageImage.src = (currentCareerData || currentStageData)?.image || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        elements.stageName.textContent = currentCareerData?.levels?.[gameState.careerLevel]?.title || currentStageData?.displayName || gameState.stage;
    }

    elements.statusDisplay.innerHTML = '';
    let statusHTML = '';
    if (gameState.isMarried) {
        statusHTML += `<div class="flex items-center text-sm bg-red-100 text-red-700 p-2 rounded-lg"><span class="font-bold mr-2">Status:</span> Menikah</div>`;
    } else if (gameState.hasPartner) {
        statusHTML += `<div class="flex items-center text-sm bg-pink-100 text-pink-700 p-2 rounded-lg"><span class="font-bold mr-2">Status:</span> Punya Pacar</div>`;
    } else {
        statusHTML += `<div class="flex items-center text-sm bg-gray-100 text-gray-700 p-2 rounded-lg"><span class="font-bold mr-2">Status:</span> Lajang</div>`;
    }
    if (gameState.children.length > 0) {
        statusHTML += `<div class="flex items-center text-sm bg-blue-100 text-blue-800 p-2 rounded-lg mt-2"><span class="font-bold mr-2">Anak:</span> ${gameState.children.length}</div>`;
    }
    if(gameState.gamblingAddiction){
        statusHTML += `<div class="flex items-center text-sm bg-yellow-100 text-yellow-800 p-2 rounded-lg mt-2"><span class="font-bold mr-2">Peringatan:</span> Kecanduan Judi</div>`;
    }
     if(gameState.dietQuality < -20){
        statusHTML += `<div class="flex items-center text-sm bg-green-100 text-green-800 p-2 rounded-lg mt-2"><span class="font-bold mr-2">Kesehatan:</span> Pola Makan Buruk</div>`;
    }
    elements.statusDisplay.innerHTML = statusHTML;

    elements.financialSummaryDisplay.innerHTML = '';
    let summaryHTML = '<h3 class="text-lg font-semibold text-gray-800 mb-2">Ringkasan Keuangan Tahunan</h3>';
    let totalIncome = 0;
    let totalExpenses = 0;
    
    const salary = (gameState.career && gameData.careers[gameState.career]) ? gameData.careers[gameState.career].levels[gameState.careerLevel].salary : 0;
    if (salary > 0) {
        summaryHTML += `<div class="expense-item text-sm"><span class="text-gray-600">Gaji:</span><span class="font-medium text-green-600">+Rp${new Intl.NumberFormat('id-ID').format(salary)}</span></div>`;
        totalIncome += salary;
    }

    const addExpense = (label, amount) => {
        if (amount > 0) {
            summaryHTML += `<div class="expense-item text-sm"><span class="text-gray-600">${label}:</span><span class="font-medium text-red-600">-Rp${new Intl.NumberFormat('id-ID').format(amount)}</span></div>`;
            totalExpenses += amount;
        }
    };
    
    for (const expenseId in gameData.expenses) {
        const expense = gameData.expenses[expenseId];
        try {
            if (eval(expense.condition)) {
                let amount = 0;
                if (typeof expense.amount === 'string' && expense.amount.includes('%')) {
                    const percentage = parseFloat(expense.amount) / 100;
                    amount = Math.floor(salary * percentage);
                } else if (expense.per === 'child') {
                    amount = expense.amount * gameState.children.length;
                } else {
                    amount = expense.amount;
                }
                addExpense(expense.description, amount);
            }
        } catch (e) {
            console.error("Error evaluating expense condition:", e);
        }
    }

    gameState.assets.forEach(assetId => {
        const asset = gameData.assets[assetId];
        addExpense(`${asset.name.replace(/^(Beli|Sewa) /i, '')} Biaya Perawatan`, asset.upkeep);
    });


    if (totalIncome > 0 || totalExpenses > 0) {
        const netChange = totalIncome - totalExpenses;
        const netColor = netChange >= 0 ? 'text-green-700' : 'text-red-700';
        const netSign = netChange >= 0 ? '+' : '-';
        summaryHTML += `<hr class="my-1"><div class="expense-item font-bold"><span class="text-gray-800">Bersih:</span><span class="${netColor}">${netSign}Rp${new Intl.NumberFormat('id-ID').format(Math.abs(netChange))}</span></div>`;
    } else {
        summaryHTML += `<p class="text-sm text-gray-500">Tidak ada pemasukan atau pengeluaran signifikan.</p>`;
    }
    elements.financialSummaryDisplay.innerHTML = summaryHTML;
}

function applyStatChangeAnimation(key, change) {
    const container = document.getElementById(`container-${key}`);
    if (!container) return;
    container.classList.add(change > 0 ? 'stat-increase' : 'stat-decrease');
    setTimeout(() => container.classList.remove('stat-increase', 'stat-decrease'), 500);
    
    const statValueElement = document.getElementById(`stat-${key}`);
    if (statValueElement) {
        statValueElement.classList.add(change > 0 ? 'stat-value-increase' : 'stat-value-decrease');
        setTimeout(() => {
            statValueElement.classList.remove('stat-value-increase', 'stat-value-decrease');
        }, 500);
    }
}

function updateGameState(updates) {
    Object.keys(updates).forEach(key => {
        const oldValue = gameState[key];
        const newValue = updates[key];
        if (typeof oldValue === 'number' && typeof newValue === 'number') {
            const change = newValue - oldValue;
             if (change !== 0) applyStatChangeAnimation(key, change);
        }
        else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
            const change = newValue.length - oldValue.length;
            if (change !== 0) applyStatChangeAnimation(key, change);
        }
        gameState[key] = newValue;
    });
    updateDisplay();
    updateAllButtonStates();
}

function updateActions() {
    const actionButtonsContainer = document.getElementById('action-buttons');
    actionButtonsContainer.innerHTML = '';

    let actionKey;
    if (gameState.stage === 'Retirement') {
        actionKey = 'Retirement';
    } else if (gameState.stage === 'College' && gameState.hasMajored) {
        actionKey = 'College_Majored';
    } else {
        actionKey = gameState.career || gameState.stage;
    }
    
    let currentActions = [...(gameData.actions[actionKey] || [])];

    if (gameState.stage !== 'Kindergarten' && gameState.stage !== 'Elementary School' && gameState.stage !== 'Retirement') {
        if (gameState.isMarried) {
            currentActions.push({ name: "Ajukan Cerai", special: "divorce" });
            currentActions.push({ name: "Punya Anak", special: "haveChild" });
        } else if (gameState.hasPartner) {
            currentActions.push({ name: "Lamar", special: "propose" });
        } else {
            currentActions.push({ name: "Cari Cinta", special: "tryToFindLove" });
        }

        for (const assetId in gameData.assets) {
            const asset = gameData.assets[assetId];
            let canShowButton = true;

            const meetsRequirements = Object.keys(asset.requirements).every(req => gameState[req] >= asset.requirements[req]);
            if (!meetsRequirements) {
                canShowButton = false;
            }

            if (gameState.assets.includes(assetId)) {
                canShowButton = false;
            }

            if (asset.type === 'housing') {
                const hasHousing = gameState.assets.some(id => gameData.assets[id].type === 'housing');
                if (hasHousing) {
                    canShowButton = false;
                }
            }
            
            if (canShowButton) {
                currentActions.push({ name: asset.name, special: "buyAsset", specialArg: assetId });
            }
        }
    }

    currentActions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.name;
        button.className = "bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200";
        
        button.dataset.action = JSON.stringify(action);

        button.onclick = () => {
            if (button.disabled) return;

            // Check for cost and energy before executing any action
            if (action.cost && gameState.money < action.cost) {
                showMessage("Kamu tidak punya cukup uang untuk ini.", "error");
                return;
            }
            if (action.energyCost && gameState.energy < action.energyCost) {
                showMessage("Kamu terlalu lelah untuk melakukan ini.", "error");
                return;
            }

            if (action.career) {
                const careerData = gameData.careers[action.career];
                if (!careerData) return;

                const requirements = careerData.levels[0].requirements;
                const unmetRequirements = Object.keys(requirements).filter(req => gameState[req] < requirements[req]);

                if (unmetRequirements.length === 0) {
                    let updates = { ...gameState };
                    if (action.effect) {
                        for (let stat in action.effect) {
                            updates[stat] = (updates[stat] || 0) + action.effect[stat];
                        }
                    }
                    updates.career = action.career;
                    updates.hasMajored = true;
                    showMessage(`Kamu telah memilih jurusan ${action.name.replace(/^(Jurusan) /i, '')}!`, "success");
                    updateGameState(updates);
                    updateActions();
                } else {
                    const reqText = unmetRequirements.map(req => `${req.charAt(0).toUpperCase() + req.slice(1)}`).join(', ');
                    showMessage(`${reqText} kamu tidak cukup tinggi untuk jurusan ini.`, "error");
                }
            } 
            else if (action.special && actionHandlers[action.special]) {
                actionHandlers[action.special](action.specialArg);
            } 
            else if (action.effect) {
                let updates = { ...gameState };
                // THIS IS THE FIX: Deduct cost and energy for general actions
                updates.money -= (action.cost || 0);
                updates.energy -= (action.energyCost || 0);
                for (let stat in action.effect) {
                    updates[stat] = (updates[stat] || 0) + action.effect[stat];
                }
                updateGameState(updates);
            }
        };

        actionButtonsContainer.appendChild(button);
    });
    updateAllButtonStates();
}

function updateAllButtonStates() {
    const buttons = document.querySelectorAll('#action-buttons button');
    buttons.forEach(button => {
        const actionData = JSON.parse(button.dataset.action || '{}');
        let disabled = false;
        
        if (actionData.cost && actionData.cost > gameState.money) {
            disabled = true;
        }
        if (actionData.energyCost && actionData.energyCost > gameState.energy) {
            disabled = true;
        }

        button.disabled = disabled;
        button.classList.toggle('opacity-50', disabled);
        button.classList.toggle('cursor-not-allowed', disabled);
    });
}

function triggerRandomEvent() {
    if (!gameData.events) return;
    const eventRoll = Math.random();
    let cumulativeChance = 0;
    
    for (const event of gameData.events) {
        cumulativeChance += event.chance;
        if (eventRoll < cumulativeChance) {
            let message = event.message;
            if (event.effect.money) {
                message = message.replace(/Rp\d+(\.\d{3})*/, `Rp${new Intl.NumberFormat('id-ID').format(event.effect.money)}`);
            }
            showMessage(message, 'info');
            
            let updates = { ...gameState };
            for (let stat in event.effect) {
                updates[stat] = (updates[stat] || 0) + event.effect[stat];
            }
            updateGameState(updates);
            return;
        }
    }
}

function applyYearlyEffects() {
    let updates = { ...gameState };
    updates.age += 1;
    updates.energy = 100; 
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const salary = (gameState.career && gameData.careers[gameState.career]) ? gameData.careers[gameState.career].levels[gameState.careerLevel].salary : 0;
    totalIncome += salary;

    for (const expenseId in gameData.expenses) {
        const expense = gameData.expenses[expenseId];
        try {
            if (eval(expense.condition)) {
                let amount = 0;
                if (typeof expense.amount === 'string' && expense.amount.includes('%')) {
                    amount = Math.floor(salary * (parseFloat(expense.amount) / 100));
                } else if (expense.per === 'child') {
                    amount = expense.amount * gameState.children.length;
                } else {
                    amount = expense.amount;
                }
                totalExpenses += amount;
            }
        } catch(e) { console.error("Error evaluating expense condition:", e); }
    }
    gameState.assets.forEach(assetId => {
        totalExpenses += gameData.assets[assetId].upkeep;
    });
    
    updates.money += (totalIncome - totalExpenses);

    updates.children = updates.children.map(child => ({ ...child, age: child.age + 1 }));
    if (updates.children.length > 0) {
        updates.fun += 5;
    }

    updates.health -= Math.floor((updates.age + 1) / 20);
    updates.fun -= 1;
    updates.relationships -= 1;

    if(updates.isMarried) {
        updates.relationships += 5;
        updates.fun += 5;
    }
    
    if(updates.dietQuality > 20) updates.health += 2;
    if(updates.dietQuality < -20) updates.health -= 5;

    if (updates.age < 18) updates.intelligence += 2;
    
    updateGameState(updates);
}

function checkStage() {
    const previousStage = gameState.stage;
    let newStage = previousStage;

    for (let stageName in gameData.stages) {
        const { minAge, maxAge } = gameData.stages[stageName];
        if (gameState.age >= minAge && (!maxAge || gameState.age <= maxAge)) {
            newStage = stageName;
            break;
        }
    }

    if (newStage !== previousStage) {
        let updates = { ...gameState, stage: newStage };
        showMessage(`Kamu sekarang berada di tahap ${gameData.stages[newStage].displayName || newStage}!`, 'success');
        
        if (newStage === 'Working Adult') {
            if (previousStage === 'College' && gameState.career) {
                updates.flags = { ...updates.flags, graduated: true };
                showMessage("Kamu telah lulus kuliah!", 'success');
            }
            if (!gameState.career) {
                updates.career = 'Unemployed';
            }
        } else if (newStage === 'Retirement') {
            showMessage("Kamu telah resmi pensiun dari karirmu.", "success");
        }

        updateGameState(updates);
        updateActions();
    }
}

function getSummary() {
    let summaryLines = [];
    if (gameState.health <= 0) {
        summaryLines.push(`Perjalananmu berakhir lebih awal pada usia ${gameState.age} karena kesehatan yang buruk.`);
    } else {
        summaryLines.push(`Kamu menjalani hidup sepenuhnya, mencapai usia ${gameState.age}.`);
    }
    if (gameState.isMarried) summaryLines.push("Kamu menikah dengan bahagia.");
    if (gameState.children.length > 0) {
        summaryLines.push(`Kamu membesarkan ${gameState.children.length} anak.`);
    }
    if (gameState.assets.some(id => gameData.assets[id].type === 'housing' && gameData.assets[id].cost > 0)) {
        summaryLines.push("Kamu adalah seorang pemilik rumah.");
    }
    if (gameState.money > 2000000000) summaryLines.push("Kamu pensiun sebagai miliarder.");
    else if (gameState.money < 10000000) summaryLines.push("Kamu hidup dengan sangat sedikit harta di akhir hayatmu.");
    if (gameState.fun > 80) summaryLines.push("Melihat ke belakang, hidupmu penuh suka cita dan memuaskan.");
    else if (gameState.fun < 20) summaryLines.push("Melihat ke belakang, hidupmu kurang suka cita dan kegembiraan.");
    if (gameState.gamblingAddiction) summaryLines.push("Kamu berjuang melawan kecanduan judi.");
    return summaryLines.join('\n');
}

function nextYear() {
    applyYearlyEffects();
    triggerRandomEvent();
    checkStage();
    updateActions();

    if (gameState.health <= 0 || gameState.age >= 80) {
        endGame();
    }
}

function endGame() {
    elements.gameContainer.classList.add('hidden');
    elements.gameOverScreen.classList.remove('hidden');
    elements.summary.textContent = getSummary();
}

function resetGame() {
    gameState = getInitialState();
    elements.gameOverScreen.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    updateDisplay();
    updateActions();
}

async function initializeGame() {
    try {
        const [stagesRes, careersRes, actionsRes, eventsRes, expensesRes, assetsRes] = await Promise.all([
            fetch('scr/data/stages.json'),
            fetch('scr/data/careers.json'),
            fetch('scr/data/actions.json'),
            fetch('scr/data/events.json'),
            fetch('scr/data/expenses.json'),
            fetch('scr/data/assets.json')
        ]);
        gameData.stages = await stagesRes.json();
        gameData.careers = await careersRes.json();
        gameData.actions = await actionsRes.json();
        gameData.events = await eventsRes.json();
        gameData.expenses = await expensesRes.json();
        gameData.assets = await assetsRes.json();
        
        setupStatDisplays();
        updateDisplay();
        updateActions();

    } catch (error) {
        console.error("Failed to load game data:", error);
        showMessage("Could not load game data. Please check file paths and JSON.", "error");
    }
}

// --- EVENT LISTENERS ---
elements.nextYearBtn.addEventListener('click', nextYear);
elements.playAgainBtn.addEventListener('click', resetGame);

// --- INITIALIZE GAME ---
window.onload = initializeGame;