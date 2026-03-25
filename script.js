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

// ОБРАБОТКА КЛАВИАТУРЫ
// Добавляем класс при фокусе на инпуты, чтобы скрыть плашки
document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT') document.body.classList.add('keyboard-open');
});
document.addEventListener('focusout', (e) => {
    if (e.target.tagName === 'INPUT') document.body.classList.remove('keyboard-open');
});

// НАВИГАЦИЯ
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.getElementById('screen-title').innerText = { 
        'screen-home': 'Главная', 'screen-counter': 'Счетчик', 
        'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' 
    }[id];

    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');

    const indicator = document.getElementById('tab-indicator');
    if (indicator && idx !== undefined) {
        indicator.style.left = `${(idx * 33.33) + 16.66}%`;
        indicator.style.transform = 'translateX(-50%)';
        document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
        if (el) el.classList.add('active');
    }
    if (id === 'screen-home') renderCards();
}

// СЧЕТЧИК
function createRowElement(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}">
        <input type="number" inputmode="decimal" class="item-price" placeholder="0" value="${price}" oninput="updateTotal()">
    `;
    return row;
}

function openFile(index) {
    currentEditingIndex = index;
    const list = document.getElementById('items-list');
    list.innerHTML = '';
    if (index === -1) {
        createNewRow();
        document.getElementById('total-value').innerText = '0 ₽';
    } else {
        savedRecords[index].items.forEach(item => list.appendChild(createRowElement(item.name, item.price)));
        updateTotal();
    }
    showScreen('screen-counter', null, 0);
}

function createNewRow() { 
    const list = document.getElementById('items-list');
    list.appendChild(createRowElement());
    list.scrollTop = list.scrollHeight;
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(i => total += Number(i.value) || 0);
    document.getElementById('total-value').innerText = total.toLocaleString() + ' ₽';
}

function saveAndHome() {
    const totalText = document.getElementById('total-value').innerText.replace(' ₽', '').replace(/\s/g, '');
    const items = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const n = row.querySelector('.item-name').value;
        const p = row.querySelector('.item-price').value;
        if (n || p) items.push({ name: n, price: p });
    });
    
    if (items.length > 0) {
        const record = { 
            date: currentEditingIndex === -1 ? new Date().toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit'}) : savedRecords[currentEditingIndex].date, 
            total: totalText, 
            items: items 
        };
        if (currentEditingIndex === -1) savedRecords.unshift(record); 
        else savedRecords[currentEditingIndex] = record;
        
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
    }
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = `<div class="history-card" style="border:2px dashed rgba(128,128,128,0.3)" onclick="openFile(-1)"><span style="font-size:40px">+</span></div>`;
    savedRecords.forEach((rec, idx) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.onclick = () => openFile(idx);
        card.innerHTML = `
            <button class="del-btn" onclick="deleteCard(${idx}, event)">✕</button>
            <div style="font-size:12px; opacity:0.6">${rec.date}</div>
            <div class="card-sum">${Number(rec.total).toLocaleString()} ₽</div>
        `;
        container.appendChild(card);
    });
}

function deleteCard(idx, e) {
    e.stopPropagation();
    tg.showConfirm("Удалить запись?", (ok) => { 
        if(ok) { 
            savedRecords.splice(idx, 1); 
            localStorage.setItem('money_logs', JSON.stringify(savedRecords)); 
            renderCards(); 
        } 
    });
}

// КОНВЕРТЕР (Упрощенный вызов)
async function fetchRates() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.result === "success") {
            exchangeRates = data.rates;
            document.getElementById('rate-update-time').innerText = `Обновлено: ${new Date().toLocaleTimeString()}`;
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
    document.getElementById('current-rate-display').innerText = `1 ${from} = ${((1/exchangeRates[from])*exchangeRates[to]).toFixed(4)} ${to}`;
}

function swapCurrencies() {
    const f = document.getElementById('from-currency');
    const t = document.getElementById('to-currency');
    [f.value, t.value] = [t.value, f.value];
    convertCurrency();
}

function handleGlobalClick(e) { 
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        document.activeElement.blur(); 
    }
}

function clearData() {
    tg.showConfirm("Сбросить все данные?", (ok) => { 
        if(ok) { localStorage.clear(); savedRecords = []; renderCards(); } 
    });
}

window.onload = () => {
    if (tg.initDataUnsafe?.user) {
        document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
        if (tg.initDataUnsafe.user.photo_url) document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;
    }
    fetchRates(); 
    renderCards();
};
