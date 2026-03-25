const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;
let exchangeRates = {};
let uiTimeout; // Таймер для управления скрытием UI

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

function openFile(index) {
    currentEditingIndex = index;
    const list = document.getElementById('items-list');
    list.innerHTML = '';
    if (index === -1) {
        createNewRow();
        document.getElementById('total-value').innerText = '0';
    } else {
        const data = savedRecords[index];
        data.items.forEach(item => list.appendChild(createRowElement(item.name, item.price)));
        updateTotal();
    }
    showScreen('screen-counter', null, 0);
}

function createRowElement(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}" onfocus="toggleUI(true)" onblur="toggleUI(false)">
        <input type="number" inputmode="decimal" class="item-price" placeholder="0" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true)" onblur="toggleUI(false)">
    `;
    return row;
}

function createNewRow() {
    const list = document.getElementById('items-list');
    list.appendChild(createRowElement());
    setTimeout(() => list.scrollTo({top: list.scrollHeight, behavior: 'smooth'}), 100);
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(i => total += Number(i.value) || 0);
    document.getElementById('total-value').innerText = total;
}

function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    const items = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const n = row.querySelector('.item-name').value;
        const p = row.querySelector('.item-price').value;
        if (n || p) items.push({ name: n, price: p });
    });
    if (items.length > 0) {
        const record = { 
            date: currentEditingIndex === -1 ? new Date().toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit'}) : savedRecords[currentEditingIndex].date, 
            total, items 
        };
        if (currentEditingIndex === -1) savedRecords.unshift(record);
        else savedRecords[currentEditingIndex] = record;
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
    }
}

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
        card.innerHTML = `
            <button class="del-btn" onclick="deleteCard(${index}, event)">✕</button>
            <div class="card-date">${rec.date}</div>
            <div class="card-sum">${rec.total} ₽</div>
        `;
        container.appendChild(card);
    });
}

function deleteCard(idx, e) {
    e.stopPropagation();
    tg.showConfirm("Удалить этот список?", (ok) => {
        if(ok) {
            savedRecords.splice(idx, 1);
            localStorage.setItem('money_logs', JSON.stringify(savedRecords));
            renderCards();
        }
    });
}

// УЛУЧШЕННОЕ УПРАВЛЕНИЕ UI ПРИ КЛАВИАТУРЕ
function toggleUI(focused) {
    clearTimeout(uiTimeout); 
    const nav = document.getElementById('bottom-nav');
    const controls = document.getElementById('counter-controls');
    
    if (focused) {
        // Скрываем мгновенно при фокусе
        nav.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
    } else {
        // Возвращаем с задержкой, чтобы проверить, не перешел ли фокус в другой инпут
        uiTimeout = setTimeout(() => {
            const active = document.activeElement.tagName;
            if (active !== 'INPUT' && active !== 'SELECT') {
                nav.classList.remove('hidden');
                if (controls) controls.classList.remove('hidden');
            }
        }, 100);
    }
}

function handleGlobalClick(e) {
    // Если клик мимо инпута и селекта — убираем фокус
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        document.activeElement.blur();
    }
}

function clearData() {
    tg.showConfirm("Удалить всё?", (ok) => {
        if(ok) { localStorage.clear(); savedRecords = []; renderCards(); showScreen('screen-home', null, 0); }
    });
}

// КОНВЕРТЕР
async function fetchRates() {
    const rateDisplay = document.getElementById('current-rate-display');
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        if (data && data.result === "success") {
            exchangeRates = data.rates;
            document.getElementById('rate-update-time').innerText = `Обновлено: ${new Date().toLocaleTimeString()}`;
            convertCurrency();
        }
    } catch (e) { rateDisplay.innerText = "Ошибка сети"; }
}

function convertCurrency() {
    const fromAmtInput = document.getElementById('from-amount');
    const toAmtInput = document.getElementById('to-amount');
    const fromCur = document.getElementById('from-currency').value;
    const toCur = document.getElementById('to-currency').value;
    
    const fromAmt = parseFloat(fromAmtInput.value);
    
    if (isNaN(fromAmt)) {
        toAmtInput.value = "";
        return;
    }

    if (exchangeRates[fromCur] && exchangeRates[toCur]) {
        const res = (fromAmt / exchangeRates[fromCur]) * exchangeRates[toCur];
        toAmtInput.value = res.toFixed(2);
        
        const rate = (1 / exchangeRates[fromCur]) * exchangeRates[toCur];
        document.getElementById('current-rate-display').innerText = `1 ${fromCur} = ${rate.toFixed(4)} ${toCur}`;
    }
}

function swapCurrencies() {
    const from = document.getElementById('from-currency');
    const to = document.getElementById('to-currency');
    [from.value, to.value] = [to.value, from.value];
    convertCurrency();
}

window.onload = () => {
    renderCards();
    fetchRates();
    // Слушатель кликов по всей области приложения
    document.body.addEventListener('click', handleGlobalClick);
};
