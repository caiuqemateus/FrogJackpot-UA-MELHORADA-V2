document.addEventListener('DOMContentLoaded', async () => {
    // Elementos do DOM
    const frogCards = document.querySelectorAll('.frog-card');
    const selectedFrogsGrid = document.querySelector('.selected-frogs-grid');
    const selectedFrogsCount = document.querySelector('.selected-frogs-count');
    const betInput = document.querySelector('.bet-input');
    const multiplierButtons = document.querySelectorAll('.multiplier-button');
    const multiplierValue = document.querySelector('.multiplier-value');
    const presetButtons = document.querySelectorAll('.preset-button');
    const clearButton = document.querySelector('.action-button.secondary');
    const betButton = document.querySelector('.action-button.primary');
    const quickBetButton = document.querySelector('.action-button.warning');
    const balanceValue = document.querySelector('.balance-value');
    const jackpotValue = document.querySelector('.jackpot-amount');
    const depositButton = document.querySelector('.balance-action:first-child');
    const withdrawButton = document.querySelector('.balance-action:last-child');
    const depositMainButton = document.querySelector('button.depositar');
    const withdrawMainButton = document.querySelector('button.sacar');

    // Catálogo de sapos
    const frogImages = [
        {
            name: 'Sapo Azul de Bolinha',
            imageUrl: 'https://i.postimg.cc/LYLKMX78/azul1.png'
        },
        {
            name: 'Sapo Azul Esverdeado',
            imageUrl: 'https://i.postimg.cc/DmQkjSLC/azul2.png'
        },
        {
            name: 'Sapo Azul Símbolo',
            imageUrl: 'https://i.postimg.cc/zVJm9qkq/azul3.png'
        },
        {
            name: 'Sapo Amarelo Estrela',
            imageUrl: 'https://i.postimg.cc/gLp9cpFq/amarelo1.png'
        },
        {
            name: 'Sapo Amarelo Bolinhas',
            imageUrl: 'https://i.postimg.cc/rRNBKHq6/amarelo2.png'
        },
        {
            name: 'Sapo Laranja Peito Verde',
            imageUrl: 'https://i.postimg.cc/dL4MFgWr/laranja1.png'
        },
        {
            name: 'Sapo Verde Listrado',
            imageUrl: 'https://i.postimg.cc/dh1bVnXX/verde1.png'
        },
        {
            name: 'Sapo Verde X',
            imageUrl: 'https://i.postimg.cc/LJbrYLFs/verde2.png'
        },
        {
            name: 'Sapo Verde XX',
            imageUrl: 'https://i.postimg.cc/WDqxMzsw/verde3.png'
        },
        {
            name: 'Sapo Vermelho Pernas Pretas',
            imageUrl: 'https://i.postimg.cc/vgRkXyBF/vermelho1.png'
        },
        {
            name: 'Sapo Vermelho Xestrela',
            imageUrl: 'https://i.postimg.cc/62dSmP27/vermelho2.png'
        },
        {
            name: 'Sapo Vermelho Coração',
            imageUrl: 'https://i.postimg.cc/p5R7bBzs/vermelho3.png'
        }
    ];

    // Estado do jogo
    let gameState = {
        selectedFrogs: 0,
        maxSelections: 6,
        currentBet: 50,
        currentMultiplier: 1,
        balance: 2172.50,
        jackpot: 100097.06,
        isRevealing: false,
        gameHistory: [],
        gameCount: 0,
        houseProfitTotal: 0,
        jackpotContribution: 0,
        qualifiedForJackpot: false,
        lastGameTime: null,
        isAutoPlaying: false,
        autoPlayCount: 0,
        autoPlayMaxCount: 100,
        shouldStopAutoPlay: false,
        selectedColors: []
    };

    // Sistema de sons
    const SOUND_URLS = {
    win: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
    lose: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    reveal: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3' // Som de revelação
    };

    const soundCache = {};
        // Funções do jogo
    async function preloadSounds() {
        try {
            for (const [key, url] of Object.entries(SOUND_URLS)) {
                const audio = new Audio(url);
                audio.preload = 'auto';
                soundCache[key] = audio;
                await new Promise((resolve) => {
                    audio.oncanplaythrough = resolve;
                    audio.onerror = resolve;
                });
            }
            console.log('Sons carregados com sucesso');
        } catch (error) {
            console.error('Erro ao carregar sons:', error);
        }
    }

    function playSound(type) {
    if (soundCache[type]) {
        soundCache[type].currentTime = 0; // Reinicia o som
        soundCache[type].play().catch(console.error); // Toca o som e exibe erros, se houver
    }
}

    function initializeFrogCards() {
        const frogGrid = document.querySelector('.frog-grid');
        frogGrid.innerHTML = '';

        frogImages.forEach((frog, index) => {
            const frogCard = document.createElement('div');
            frogCard.className = `frog-card frog-type-${(index % 6) + 1}`;
            frogCard.innerHTML = `
                <div class="frog-card-inner">
                    <img src="${frog.imageUrl}" alt="${frog.name}" class="frog-image">
                </div>
                <div class="frog-card-bg"></div>
            `;
            frogGrid.appendChild(frogCard);
            frogCard.addEventListener('click', () => selectFrog(frogCard));
        });
    }

    function updateSelectedCount() {
        selectedFrogsCount.textContent = `${gameState.selectedFrogs}/${gameState.maxSelections}`;
    }

    function updateBetValue(value) {
        gameState.currentBet = Number(value);
        betInput.value = value;
    }

    function updateMultiplier(value) {
        gameState.currentMultiplier = Number(value);
        multiplierValue.value = value;
    }

    function selectFrog(card) {
        if (gameState.selectedFrogs < gameState.maxSelections) {
            playSound('click');
            const emptySlot = Array.from(selectedFrogsGrid.children)
                .find(slot => slot.classList.contains('empty'));
            
            if (emptySlot) {
                emptySlot.classList.remove('empty');
                const frogClone = card.querySelector('.frog-card-inner').cloneNode(true);
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-frog';
                removeButton.innerHTML = '×';
                removeButton.onclick = () => removeFrog(card, emptySlot);
                
                emptySlot.appendChild(frogClone);
                emptySlot.appendChild(removeButton);
                gameState.selectedFrogs++;
                updateSelectedCount();
                
                // Adiciona o índice do sapo ao array de seleções
                const frogIndex = Array.from(document.querySelectorAll('.frog-card')).indexOf(card);
                gameState.selectedColors.push(frogIndex);
            }
        }
    }

    function removeFrog(originalCard, slot) {
        slot.innerHTML = '';
        slot.classList.add('empty');
        gameState.selectedFrogs--;
        updateSelectedCount();
        
        // Remove o sapo do array de seleções
        const slotIndex = Array.from(selectedFrogsGrid.children).indexOf(slot);
        gameState.selectedColors.splice(slotIndex, 1);
    }

    function clearSelection() {
        Array.from(selectedFrogsGrid.children).forEach(slot => {
            slot.innerHTML = '';
            slot.classList.add('empty');
        });
        gameState.selectedFrogs = 0;
        gameState.selectedColors = [];
        updateSelectedCount();
    }

    function updateCurrentDateTime() {
        const now = new Date();
        const formattedDateTime = now.toISOString()
            .replace('T', ' ')
            .replace(/\.\d{3}Z$/, '');
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = formattedDateTime;
        }
    }

    function updateUserLogin() {
        const currentUser = 'amigodolanche191';
        const userLoginElement = document.querySelector('.current-user');
        if (userLoginElement) {
            userLoginElement.textContent = `Usuário: ${currentUser}`;
        }
    }

    function formatCurrency(value) {
        const fixed = value.toFixed(2);
        const [integerPart, decimalPart] = fixed.split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `R$ ${formattedInteger},${decimalPart}`;
    }
        function updateCurrentDateTime() {
        const now = new Date();
        // Formato UTC YYYY-MM-DD HH:MM:SS
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = formattedDateTime;
        }
    }

    function updateBalance(newBalance) {
        gameState.balance = newBalance;
        balanceValue.textContent = formatCurrency(newBalance);
        saveGameState();
    }

    function updateJackpotValue(value) {
        gameState.jackpot = value;
        jackpotValue.textContent = formatCurrency(value);
        saveGameState();
    }

    async function revealResults(results) {
    const resultGrid = document.querySelector('.results-grid');
    resultGrid.innerHTML = '';

    for (let i = 0; i < results.length; i++) {
        const resultSlot = document.createElement('div');
        resultSlot.className = 'result-frog revealing'; // Adiciona a classe de animação
        
        const frogImage = document.createElement('img');
        frogImage.src = frogImages[results[i]].imageUrl;
        frogImage.alt = frogImages[results[i]].name;
        
        resultSlot.appendChild(frogImage);
        resultGrid.appendChild(resultSlot);

        // Toca o som de revelação
        playSound('reveal');

        // Aguarda a animação antes de exibir o próximo sapo
        await new Promise(resolve => setTimeout(resolve, 700)); // Tempo maior que o da animação CSS
    }
}

    function checkConsecutiveMatches(selected, results) {
        let maxLength = 0;
        let currentLength = 0;
        let startIndex = -1;
        let tempStartIndex = 0;
        
        for (let i = 0; i < 6; i++) {
            if (selected[i] === results[i]) {
                if (currentLength === 0) {
                    tempStartIndex = i;
                }
                currentLength++;
                
                if (currentLength > maxLength) {
                    maxLength = currentLength;
                    startIndex = tempStartIndex;
                }
            } else {
                currentLength = 0;
            }
        }
        
        return { maxLength, startIndex };
    }

    function checkSimpleMatches(selected, results) {
        let matches = 0;
        const positions = [];
        
        for (let i = 0; i < 6; i++) {
            if (selected[i] === results[i]) {
                matches++;
                positions.push(i);
            }
        }
        
        return { count: matches, positions };
    }

   function checkWin(results, totalBet) {
    if (!Array.isArray(results) || results.length === 0) {
        console.error("Erro: O array 'results' está vazio ou não é válido.");
        return;
    }

    const selectedIndices = gameState.selectedColors;

    // Verifica sequências consecutivas
    const consecutiveMatches = checkConsecutiveMatches(selectedIndices, results);
    // Verifica acertos simples
    const simpleMatches = checkSimpleMatches(selectedIndices, results);

    let winAmount = 0;
    let winType = '';
    let winningPositions = [];

    // Verifica diferentes tipos de vitória
    if (consecutiveMatches.maxLength === 6) {
        if (gameState.qualifiedForJackpot) {
            winAmount = gameState.jackpot;
            winType = 'JACKPOT!';
            gameState.jackpot = 100000;
            updateJackpotValue(100000);
        } else {
            winAmount = totalBet * 1000;
            winType = 'Sequência Completa';
        }
        winningPositions = Array.from({ length: 6 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 5) {
        winAmount = totalBet * 500;
        winType = 'Quina em Sequência';
        winningPositions = Array.from({ length: 5 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 4) {
        winAmount = totalBet * 100;
        winType = 'Quadra em Sequência';
        winningPositions = Array.from({ length: 4 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 3) {
        winAmount = totalBet * 25;
        winType = 'Tripla em Sequência';
        winningPositions = Array.from({ length: 3 }, (_, i) => i);
    } else if (consecutiveMatches.maxLength === 2) {
        winAmount = totalBet * 5;
        winType = 'Par em Sequência';
        winningPositions = Array.from({ length: 2 }, (_, i) => i);
    } else if (simpleMatches.count >= 2) {
        const multipliers = { 2: 2, 3: 3, 4: 5, 5: 10, 6: 20 };
        winAmount = totalBet * (multipliers[simpleMatches.count] || 0);
        winType = `${simpleMatches.count} Acertos Simples`;
        winningPositions = simpleMatches.positions;
    }

    // Destacar os sapos vencedores
    highlightWinners(winningPositions, results);

    // Processa o resultado
    if (winAmount > 0) {
        gameState.balance += winAmount;
        updateBalance(gameState.balance);
        playSound('win');
        showResult(true, winAmount, winType);
    } else {
        playSound('lose');
        showResult(false, 0, 'Sem acertos');
    }

    // Atualiza contadores
    gameState.gameCount++;
    if (gameState.gameCount >= 5) {
        gameState.qualifiedForJackpot = true;
    }

    saveGameState();
}
        async function placeBet() {
    if (gameState.isRevealing) {
        alert('Aguarde a revelação da sequência atual!');
        return false;
    }

    if (gameState.selectedFrogs < gameState.maxSelections) {
        alert('Selecione 6 sapos para fazer sua aposta!');
        return false;
    }

    const totalBet = gameState.currentBet * gameState.currentMultiplier;
    if (totalBet > gameState.balance) {
        alert('Saldo insuficiente para realizar esta aposta!');
        return false;
    }

    try {
        gameState.isRevealing = true;

        // Processa a aposta
        gameState.balance -= totalBet;
        updateBalance(gameState.balance);

        // Contribuição para o jackpot (2%)
        const jackpotContribution = totalBet * 0.02;
        gameState.jackpot += jackpotContribution;
        gameState.jackpotContribution += jackpotContribution;
        updateJackpotValue(gameState.jackpot);

        // Gera resultado aleatório
        const results = Array.from({ length: 6 }, () =>
            Math.floor(Math.random() * frogImages.length)
        );

        if (!Array.isArray(results) || results.length === 0) {
            throw new Error("Erro ao gerar resultados: 'results' está vazio ou inválido.");
        }

        await revealResults(results);
        checkWin(results, totalBet);

        gameState.isRevealing = false;
        gameState.lastGameTime = new Date();

        saveGameState();
        return true;
    } catch (error) {
        console.error('Erro durante o jogo:', error);
        gameState.isRevealing = false;
        return false;
    }
}

    async function startAutoPlay() {
        const count = parseInt(document.querySelector('#autoPlayCount').value);
        
        if (isNaN(count) || count < 1 || count > gameState.autoPlayMaxCount) {
            alert('Por favor, insira um número entre 1 e 100');
            return;
        }

        gameState.isAutoPlaying = true;
        gameState.shouldStopAutoPlay = false;
        gameState.autoPlayCount = count;
        
        const playBtn = document.querySelector('.action-button.primary');
        playBtn.textContent = 'Parar Auto';
        playBtn.classList.add('auto-playing');
        
        await runAutoPlay();
    }

    async function runAutoPlay() {
    while (gameState.autoPlayCount > 0 && !gameState.shouldStopAutoPlay) {
        if (gameState.selectedFrogs !== gameState.maxSelections) {
            alert('Selecione 6 sapos antes de começar as jogadas automáticas');
            stopAutoPlay();
            break;
        }

        const success = await placeBet();
        if (!success || gameState.shouldStopAutoPlay) {
            stopAutoPlay();
            break;
        }

        gameState.autoPlayCount--;
        if (gameState.autoPlayCount > 0 && !gameState.shouldStopAutoPlay) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }
    
    if (gameState.autoPlayCount === 0 || gameState.shouldStopAutoPlay) {
        stopAutoPlay();
        // Não limpamos a seleção aqui também
    }
}

    function stopAutoPlay() {
        gameState.isAutoPlaying = false;
        gameState.shouldStopAutoPlay = true;
        gameState.autoPlayCount = 0;
        
        const playBtn = document.querySelector('.action-button.primary');
        playBtn.textContent = 'Fazer Aposta';
        playBtn.classList.remove('auto-playing');
        
        document.querySelector('#autoPlayCount').value = 0;
    }

    function showResult(win, amount, winType) {
        const resultMessage = document.querySelector('.result-message');
        resultMessage.className = 'result-message ' + (win ? 'win' : 'lose');
        
        if (win) {
            resultMessage.textContent = `Parabéns! Você ganhou ${formatCurrency(amount)}! (${winType})`;
        } else {
            resultMessage.textContent = 'Não foi dessa vez... Tente novamente!';
        }
        
        addToHistory(win, amount, winType);
    }

    function addToHistory(win, amount, winType) {
        const historyList = document.querySelector('.history-list');
        const historyItem = document.createElement('li');
        historyItem.className = 'history-item';
        
        // Formato específico para data/hora UTC
        const now = new Date();
        const timeString = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
        
        historyItem.innerHTML = `
            <div class="history-details">
                <p class="history-bet">Aposta: ${formatCurrency(gameState.currentBet * gameState.currentMultiplier)}</p>
                <p class="history-win-type">${winType || ''}</p>
                <span class="history-date">${timeString}</span>
            </div>
            <span class="history-result ${win ? 'win' : 'lose'}">
                ${win ? '+ ' + formatCurrency(amount) : 'Perdeu'}
            </span>
        `;
        
        historyList.insertBefore(historyItem, historyList.firstChild);
        if (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }
        function updateCurrentDateTime() {
        const now = new Date();
        // Formato específico UTC: YYYY-MM-DD HH:MM:SS
        const formattedDateTime = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = formattedDateTime;
        }
    }

    function saveGameState() {
        try {
            // Validação básica dos dados antes de salvar
            if (typeof gameState.balance !== 'number' || gameState.balance < 0) {
                console.error('Invalid balance state detected');
                gameState.balance = 0;
            }
            if (typeof gameState.jackpot !== 'number' || gameState.jackpot < 100000) {
                console.error('Invalid jackpot state detected');
                gameState.jackpot = 100000;
            }
            
            localStorage.setItem('saposGameState', JSON.stringify(gameState));
        } catch (error) {
            console.error('Erro ao salvar estado do jogo:', error);
        }
    }

    function loadGameState() {
        try {
            const savedState = localStorage.getItem('saposGameState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                gameState = { ...gameState, ...parsedState };
                
                // Atualiza a interface com os valores carregados
                updateBalance(gameState.balance);
                updateJackpotValue(gameState.jackpot);
                updateSelectedCount();
                
                console.log('Estado do jogo carregado com sucesso');
            }
        } catch (error) {
            console.error('Erro ao carregar estado do jogo:', error);
        }
    }

    function updateJackpotTimer() {
        const timerBoxes = document.querySelectorAll('.timer-box .timer-value');
        let [hours, minutes, seconds] = Array.from(timerBoxes).map(box => Number(box.textContent));
        
        setInterval(() => {
            seconds--;
            if (seconds < 0) {
                seconds = 59;
                minutes--;
                if (minutes < 0) {
                    minutes = 59;
                    hours--;
                    if (hours < 0) {
                        hours = 23;
                    }
                }
            }
            
            timerBoxes[0].textContent = hours.toString().padStart(2, '0');
            timerBoxes[1].textContent = minutes.toString().padStart(2, '0');
            timerBoxes[2].textContent = seconds.toString().padStart(2, '0');
        }, 1000);
    }

    function handleDeposit() {
        const amount = prompt('Digite o valor que deseja depositar:');
        const depositAmount = Number(amount);
        
        if (isNaN(depositAmount) || depositAmount <= 0) {
            alert('Por favor, digite um valor válido maior que zero.');
            return;
        }

        gameState.balance += depositAmount;
        updateBalance(gameState.balance);
        playSound('win');
        alert(`Depósito de ${formatCurrency(depositAmount)} realizado com sucesso!`);
    }

    function handleWithdraw() {
        const amount = prompt('Digite o valor que deseja sacar:');
        const withdrawAmount = Number(amount);
        
        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            alert('Por favor, digite um valor válido maior que zero.');
            return;
        }

        if (withdrawAmount > gameState.balance) {
            alert('Saldo insuficiente para realizar o saque.');
            return;
        }

        gameState.balance -= withdrawAmount;
        updateBalance(gameState.balance);
        playSound('click');
        alert(`Saque de ${formatCurrency(withdrawAmount)} realizado com sucesso!`);
    }

    // Event Listeners
    depositButton?.addEventListener('click', handleDeposit);
    withdrawButton?.addEventListener('click', handleWithdraw);
    depositMainButton?.addEventListener('click', handleDeposit);
    withdrawMainButton?.addEventListener('click', handleWithdraw);

    multiplierButtons.forEach(button => {
        button.addEventListener('click', () => {
            const currentValue = Number(multiplierValue.value);
            if (button.textContent === '+' && currentValue < 10) {
                updateMultiplier(currentValue + 1);
            } else if (button.textContent === '-' && currentValue > 1) {
                updateMultiplier(currentValue - 1);
            }
        });
    });

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            presetButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const value = button.textContent === 'Máximo' 
                ? gameState.balance 
                : Number(button.textContent.replace('R$ ', ''));
            
            updateBetValue(value);
        });
    });

    // Continuação no próximo bloco...
        // Atualiza relógio em formato UTC
    function updateCurrentDateTime() {
        const now = new Date();
        // Formato específico: YYYY-MM-DD HH:MM:SS
        const dateTimeString = now.toISOString()
            .replace('T', ' ')
            .substring(0, 19);
        
        const dateTimeElement = document.querySelector('.current-datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = dateTimeString;
        }
    }

    betInput.addEventListener('input', (e) => {
        const value = Number(e.target.value);
        if (value > gameState.balance) {
            e.target.value = gameState.balance;
            updateBetValue(gameState.balance);
        } else {
            updateBetValue(value);
        }
    });

    clearButton.addEventListener('click', () => {
    if (!gameState.isRevealing) { 
        clearSelection();
        playSound('click');
    }
});

    betButton.addEventListener('click', () => {
        if (gameState.isAutoPlaying) {
            stopAutoPlay();
        } else {
            const autoPlayCount = parseInt(document.querySelector('#autoPlayCount')?.value || '0');
            if (autoPlayCount > 0) {
                startAutoPlay();
            } else {
                placeBet();
            }
        }
    });

   quickBetButton.addEventListener('click', async () => {
    if (gameState.isRevealing) {
        alert('Aguarde a revelação da sequência atual!');
        return;
    }

    // Limpa a seleção anterior
    clearSelection();
    playSound('click');
    
    try {
        // Seleciona 6 sapos aleatórios (permite repetições)
        for (let i = 0; i < gameState.maxSelections; i++) {
            const randomIndex = Math.floor(Math.random() * frogImages.length); // Corrigido para usar frogImages
            const randomFrog = document.querySelectorAll('.frog-card')[randomIndex]; // Garante que está selecionando do DOM
            
            await new Promise(resolve => setTimeout(resolve, 200)); // Aguarda para simular tempo entre seleções
            selectFrog(randomFrog);
        }

        if (gameState.selectedFrogs !== gameState.maxSelections) {
            alert('Erro ao selecionar sapos. Por favor, tente novamente.');
            clearSelection();
        }
    } catch (error) {
        console.error('Erro na seleção rápida:', error);
        clearSelection();
    }
});

    // Inicialização do jogo
   // Modifique a função initGame para limpar os campos "Sapos Selecionados" e "Resultado da Rodada"
async function initGame() {
    try {
        await preloadSounds();
        loadGameState();
        initializeFrogCards();
        updateJackpotTimer();
        updateSelectedCount();

        // Limpa o campo "Sapos Selecionados"
        clearSelection();

        // Limpa o campo "Resultado da Rodada"
        const resultsGrid = document.querySelector('.results-grid');
        if (resultsGrid) {
            resultsGrid.innerHTML = ''; // Remove qualquer conteúdo existente
        }

        // Atualização inicial de data/hora e usuário
        updateCurrentDateTime();
        updateUserLogin();

        // Atualiza data/hora a cada segundo
        setInterval(updateCurrentDateTime, 1000);

        // Define valor inicial da aposta
        updateBetValue(50);
        updateMultiplier(1);

        // Ativa o botão de preset padrão (R$ 50)
        const defaultPreset = Array.from(presetButtons)
            .find(button => button.textContent === 'R$ 50');
        if (defaultPreset) {
            defaultPreset.classList.add('active');
        }

        console.log('Jogo inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar o jogo:', error);
    }
}

    // Event Listener para o Auto Play Count
    document.querySelector('#autoPlayCount')?.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 0) {
            e.target.value = 0;
        } else if (value > gameState.autoPlayMaxCount) {
            e.target.value = gameState.autoPlayMaxCount;
        }
    });

    // Função para debug de imagens
    function debugImagePaths() {
        console.group('Debug de Caminhos de Imagens');
        frogImages.forEach((frog, index) => {
            console.log(`Sapo ${index + 1}:`);
            console.log(`Nome: ${frog.name}`);
            console.log(`URL: ${frog.imageUrl}`);
            
            const img = new Image();
            img.onload = () => console.log(`✅ Imagem ${index + 1} carregada com sucesso`);
            img.onerror = () => console.error(`❌ Erro ao carregar imagem ${index + 1}`);
            img.src = frog.imageUrl;
        });
        console.groupEnd();
    }

    // Função para verificar carregamento das imagens
    function verifyImages() {
        console.log('Verificando imagens...');
        frogImages.forEach(frog => {
            const img = new Image();
            img.onload = () => console.log(`✅ Imagem carregada: ${frog.name}`);
            img.onerror = () => {
                console.error(`❌ Erro ao carregar: ${frog.name}`);
                console.error(`   URL: ${frog.imageUrl}`);
            };
            img.src = frog.imageUrl;
        });
    }


    function highlightWinners(matchingPositions, results) {
    const resultGrid = document.querySelector('.results-grid');
    const resultFrogs = resultGrid.querySelectorAll('.result-frog');

    const selectedFrogsGrid = document.querySelector('.selected-frogs-grid');
    const selectedFrogs = Array.from(selectedFrogsGrid.children);

    // Remove qualquer classe de destaque existente
    resultFrogs.forEach(frog => frog.classList.remove('winner'));
    selectedFrogs.forEach(frog => frog.classList.remove('winner'));

    // Adiciona a classe "winner" aos sapos vencedores
    matchingPositions.forEach((position) => {
        // Destaca nos resultados
        const winnerFrogResult = resultFrogs[position];
        if (winnerFrogResult) {
            winnerFrogResult.classList.add('winner');
        }

        // Destaca nos sapos selecionados
        const selectedFrogIndex = results[position]; // Obtém o índice do sapo vencedor
        const winnerFrogSelected = selectedFrogs.find((slot) => {
            const img = slot.querySelector('img');
            if (!img) return false; // Verifica se há uma imagem no slot
            const imgSrc = img.src.split('/').pop(); // Extrai apenas o nome do arquivo da imagem
            const resultImgSrc = frogImages[selectedFrogIndex]?.imageUrl.split('/').pop(); // Nome da imagem do resultado
            return imgSrc === resultImgSrc; // Compara os nomes das imagens
        });

        if (winnerFrogSelected) {
            winnerFrogSelected.classList.add('winner');
        } else {
            console.warn(`Nenhum sapo correspondente encontrado no campo "Sapos Selecionados" para a posição: ${position}`);
        }
    });
}
    // Inicia o jogo
    initGame();
});