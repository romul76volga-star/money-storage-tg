const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;
let exchangeRates = {};

// --- ТЕМЫ ---
function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('user_theme', theme);
    const colors = { 'theme-green': '#5d6b5e', 'theme-black': '#000000', 'theme-white': '#ffffff' };
    tg.setHeaderColor(colors[theme]);
    tg.setBackgroundColor(theme === 'theme-white' ? '#f5f5f5' : '#000000');
}

setTheme(localStorage.getItem('user_theme') || 'theme-green');

// --- НАВИГАЦИЯ ---
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('screen-title').innerText = titles[id];
    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');

    const indicator = document.getElementById('tab-indicator');
    if (indicator && idx !== undefined) {
        indicator.style.left = `${(idx * 33.33) + 16.66}%`;
        indicator.style.transform = 'translateX(-50%)';
        document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }
    if (id === 'screen-home') renderCards();
}

// --- КОНВЕРТЕР ---
async function fetchRates() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.result === "success") {
            exchangeRates = data.rates;
            document.getElementById('rate-update-time').innerText = `Обновлено: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            convertCurrency();
        }
    } catch (e) { console.error("Курсы не загружены"); }
}

function convertCurrency() {
    const fromAmt = parseFloat(document.getElementById('from-amount').value);
    const fromCur = document.getElementById('from-currency').value;
    const toCur = document.getElementById('to-currency').value;
    
    if (isNaN(fromAmt) || !exchangeRates[fromCur]) return;
    
    const res = (fromAmt / exchangeRates[fromCur]) * exchangeRates[toCur];
    document.getElementById('to-amount').value = res.toFixed(2);
    
    const rate = (1 / exchangeRates[fromCur]) * exchangeRates[toCur];
    document.getElementById('current-rate-display').innerText = `1 ${fromCur} = ${rate.toFixed(4)} ${toCur}`;
}

function swapCurrencies() {
    const from = document.getElementById('from-currency');
    const to = document.getElementById('to-currency');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
    convertCurrency();
}

// --- КАРТОЧКИ ---
function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = `<div class="history-card" style="border: 2px dashed rgba(128,128,128,0.3)" onclick="openFile(-1)">
        <span style="font-size:30px; opacity:0.5">+</span>
    </div>`;
    
    savedRecords.forEach((rec, idx) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.onclick = () => openFile(idx);
        card.innerHTML = `<div class="card-date">${rec.date}</div><div class="card-sum">${rec.total} ₽</div>`;
        container.appendChild(card);
    });
}

// --- Инициализация профиля ---
function loadUser() {
    if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        document.getElementById('user-name').innerText = u.first_name;
        if (u.photo_url) document.getElementById('user-photo').src = u.photo_url;
    } else {
        document.getElementById('user-name').innerText = "Developer";
    }
}

window.onload = () => { loadUser(); fetchRates(); renderCards(); };
