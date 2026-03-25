const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;
let exchangeRates = {};

// --- УПРАВЛЕНИЕ UI И КЛАВИАТУРОЙ ---
function updateUIVisibility() {
    const nav = document.getElementById('bottom-nav');
    const controls = document.getElementById('counter-controls');
    const isInputActive = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT';
    const isSmallHeight = window.innerHeight < 550;

    if (isInputActive || isSmallHeight) {
        if (nav) nav.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
    } else {
        if (nav) nav.classList.remove('hidden');
        if (controls) controls.classList.remove('hidden');
    }
}

window.addEventListener('resize', updateUIVisibility);
document.addEventListener('focusin', updateUIVisibility);
document.addEventListener('focusout', () => setTimeout(updateUIVisibility, 150));

// --- НАВИГАЦИЯ ---
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('screen-title').innerText = titles[id] || 'MoneyStorage';
    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');

    const indicator = document.getElementById('tab-indicator');
    if (idx !== undefined && indicator) {
        const pos = (idx * 33.33) + 16.66;
        indicator.style.left = `${pos}%`;
        indicator.style.transform = 'translateX(-50%)';
        document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
        if (el) el.classList.add('active');
    }
    if (id === 'screen-home') renderCards();
}

// --- ЛОГИКА ТЕЛЕГРАМА ---
function loadTelegramUser() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('user-name').innerText = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        if (user.photo_url) {
            document.getElementById('user-photo').src = user.photo_url;
        }
    } else {
        document.getElementById('user-name').innerText = "Developer Mode";
    }
}

// --- ВАШИ СТАРЫЕ ФУНКЦИИ (Сокращено для краткости) ---
function renderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;
    container.innerHTML = '';
    
    const addCard = document.createElement('div');
    addCard.className = 'history-card';
    addCard.style.border = '2px dashed rgba(255,255,255,0.3)';
    addCard.onclick = () => openFile(-1);
    addCard.innerHTML = `<span style="font-size: 40px; font-weight: 200;">+</span>`;
    container.appendChild(addCard);

    savedRecords.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.onclick = () => openFile(index);
        card.innerHTML = `<button class="del-btn" onclick="deleteCard(${index}, event)">✕</button>
            <div class="card-date">${rec.date}</div>
            <div class="card-sum">${rec.total} ₽</div>`;
        container.appendChild(card);
    });
}

// ... (createNewRow, openFile, updateTotal, saveAndHome, deleteCard, handleGlobalClick, fetchRates, convertCurrency, swapCurrencies остаются такими же)

function clearData() {
    tg.showConfirm("Удалить все данные?", (ok) => {
        if(ok) { localStorage.clear(); savedRecords = []; renderCards(); showScreen('screen-home', null, 0); }
    });
}

window.onload = () => {
    loadTelegramUser(); // Загружаем профиль
    renderCards();
    fetchRates();
    document.body.addEventListener('click', handleGlobalClick);
    
    const s1 = document.getElementById('from-currency');
    const s2 = document.getElementById('to-currency');
    if (s1) s1.onchange = convertCurrency;
    if (s2) s2.onchange = convertCurrency;
};
