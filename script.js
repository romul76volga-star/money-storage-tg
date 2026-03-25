const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;
let exchangeRates = {};

// ТЕМЫ
function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('user_theme', theme);
    const colors = { 'theme-green': '#5d6b5e', 'theme-black': '#000000', 'theme-white': '#ffffff' };
    tg.setHeaderColor(colors[theme] || '#5d6b5e');
}
setTheme(localStorage.getItem('user_theme') || 'theme-green');

// АВТО-РАЗМЕР ШРИФТА ДЛЯ ЦЕНЫ
function validatePrice(input) {
    const val = input.value;
    if (val.length > 8) input.style.fontSize = '10px';
    else if (val.length > 5) input.style.fontSize = '13px';
    else input.style.fontSize = '16px';
}

// СЧЕТЧИК
function createRowElement(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}">
        <input type="number" inputmode="decimal" class="item-price" placeholder="0" value="${price}" oninput="validatePrice(this); updateTotal()">
    `;
    // Применяем размер сразу, если загружаем данные
    if (price) setTimeout(() => validatePrice(row.querySelector('.item-price')), 10);
    return row;
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(i => total += Number(i.value) || 0);
    // Отображаем только число, символ ₽ добавляется в шаблоне
    document.getElementById('total-value').innerText = total.toLocaleString();
}

function openFile(index) {
    currentEditingIndex = index;
    const list = document.getElementById('items-list');
    list.innerHTML = '';
    if (index === -1) {
        createNewRow();
        document.getElementById('total-value').innerText = '0';
    } else {
        const record = savedRecords[index];
        record.items.forEach(item => list.appendChild(createRowElement(item.name, item.price)));
        updateTotal();
    }
    showScreen('screen-counter', null, 0);
}

function createNewRow() { document.getElementById('items-list').appendChild(createRowElement()); }

function saveAndHome() {
    const totalVal = document.getElementById('total-value').innerText;
    const items = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const n = row.querySelector('.item-name').value;
        const p = row.querySelector('.item-price').value;
        if (n || p) items.push({ name: n, price: p });
    });
    if (items.length > 0) {
        const record = { 
            date: currentEditingIndex === -1 ? new Date().toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit'}) : savedRecords[currentEditingIndex].date, 
            total: totalVal + ' ₽', // Сохраняем с одним символом ₽
            items 
        };
        if (currentEditingIndex === -1) savedRecords.unshift(record); else savedRecords[currentEditingIndex] = record;
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
    }
}

// НАВИГАЦИЯ
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.getElementById('screen-title').innerText = { 
        'screen-home': 'Главная', 'screen-counter': 'Счетчик', 
        'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' 
    }[id];

    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');
    document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
    if (id === 'screen-home') renderCards();
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = `<div class="history-card" style="border:2px dashed rgba(255,255,255,0.2)" onclick="openFile(-1)"><span style="font-size:40px">+</span></div>`;
    savedRecords.forEach((rec, idx) => {
        const card = document.createElement('div');
        card.className = 'history-card glass-box';
        card.onclick = () => openFile(idx);
        card.innerHTML = `<button class="del-btn" onclick="deleteCard(${idx}, event)">✕</button>
                          <div style="font-size:12px;opacity:0.5">${rec.date}</div>
                          <div class="card-sum">${rec.total}</div>`;
        container.appendChild(card);
    });
}

function deleteCard(idx, e) {
    e.stopPropagation();
    tg.showConfirm("Удалить?", (ok) => { if(ok) { savedRecords.splice(idx, 1); localStorage.setItem('money_logs', JSON.stringify(savedRecords)); renderCards(); } });
}

// КОНВЕРТЕР
async function fetchRates() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.result === "success") {
            exchangeRates = data.rates;
            document.getElementById('rate-update-time').innerText = `Обновлено: ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
            convertCurrency();
        }
    } catch (e) { console.error("Rates error"); }
}

function convertCurrency() {
    const amt = parseFloat(document.getElementById('from-amount').value);
    const from = document.getElementById('from-currency').value;
    const to = document.getElementById('to-currency').value;
    if (isNaN(amt) || !exchangeRates[from]) return;
    const res = (amt / exchangeRates[from]) * exchangeRates[to];
    document.getElementById('to-amount').value = res.toFixed(2);
}

function swapCurrencies() {
    const f = document.getElementById('from-currency');
    const t = document.getElementById('to-currency');
    [f.value, t.value] = [t.value, f.value];
    convertCurrency();
}

// ПРОФИЛЬ
function clearData() {
    tg.showConfirm("Сбросить все данные?", (ok) => { if(ok) { localStorage.clear(); savedRecords = []; renderCards(); } });
}

// Клавиатурные фиксы
document.addEventListener('focusin', (e) => { if (e.target.tagName === 'INPUT') document.body.classList.add('keyboard-open'); });
document.addEventListener('focusout', (e) => { if (e.target.tagName === 'INPUT') setTimeout(() => { if (document.activeElement.tagName !== 'INPUT') document.body.classList.remove('keyboard-open'); }, 100); });

window.onload = () => {
    if (tg.initDataUnsafe?.user) {
        document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name.toUpperCase();
        if (tg.initDataUnsafe.user.photo_url) document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;
    }
    fetchRates(); renderCards();
};
