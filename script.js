const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;
let exchangeRates = {};

// --- УПРАВЛЕНИЕ UI И КЛАВИАТУРОЙ ---
function updateUIVisibility() {
    const nav = document.getElementById('bottom-nav');
    const controls = document.getElementById('counter-controls');
    
    // Проверяем: активен ли сейчас какой-то ввод
    const isInputActive = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT';
    // Проверяем высоту: если экран стал меньше 550px, значит поднялась клавиатура
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
    
    const titles = { 
        'screen-home': 'Главная', 
        'screen-counter': 'Счетчик', 
        'screen-converter': 'Конвертер', 
        'screen-settings': 'Профиль' 
    };
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

// --- ПРОФИЛЬ ---
function loadTelegramUser() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        const fullName = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        document.getElementById('user-name').innerText = fullName;
        if (user.photo_url) {
            document.getElementById('user-photo').src = user.photo_url;
        }
    } else {
        document.getElementById('user-name').innerText = "Developer Mode";
    }
}

// --- СЧЕТЧИК (УЧЕТ ЗАТРАТ) ---
function openFile(index) {
    currentEditingIndex = index;
    const list = document.getElementById('items-list');
    list.innerHTML = '';
    
    if (index === -1) {
        createNewRow();
        document.getElementById('total-value').innerText = '0';
    } else {
        const data = savedRecords[index];
        data.items.forEach(item => {
            list.appendChild(createRowElement(item.name, item.price));
        });
        updateTotal();
    }
    showScreen('screen-counter', null, 0);
}

function createRowElement(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}">
        <input type="number" inputmode="decimal" class="item-price" placeholder="0" value="${price}" oninput="updateTotal()">
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
            total, 
            items 
        };
        
        if (currentEditingIndex === -1) {
            savedRecords.unshift(record);
        } else {
            savedRecords[currentEditingIndex] = record;
        }
        
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
    }
}

function renderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Кнопка добавления новой карточки
    const addCard = document.createElement('div');
    addCard.className = 'history-card';
    addCard.style.border = '2px dashed rgba(255,255,255,0.3)';
    addCard.onclick = () => openFile(-1);
    addCard.innerHTML = `<span style="font-size: 40px; font-weight: 200;">+</span>`;
    container.appendChild(addCard);

    // Список сохраненных карточек
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

// --- КОНВЕРТЕР ---
async function fetchRates() {
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/USD`);
        const data = await response.json();
        if (data && data.result === "success") {
            exchangeRates = data.rates;
            const timeEl = document.getElementById('rate-update-time');
            if (timeEl) timeEl.innerText = `Обновлено: ${new Date().toLocaleTimeString()}`;
            convertCurrency();
        }
    } catch (e) { 
        console.error("Ошибка сети"); 
    }
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
        const display = document.getElementById('current-rate-display');
        if (display) display.innerText = `1 ${fromCur} = ${rate.toFixed(4)} ${toCur}`;
    }
}

function swapCurrencies() {
    const from = document.getElementById('from-currency');
    const to = document.getElementById('to-currency');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
    convertCurrency();
}

// --- ОБЩЕЕ ---
function handleGlobalClick(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        document.activeElement.blur();
    }
}

function clearData() {
    tg.showConfirm("Удалить абсолютно все записи?", (ok) => {
        if(ok) { 
            localStorage.clear(); 
            savedRecords = []; 
            renderCards(); 
            showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0); 
        }
    });
}

window.onload = () => {
    loadTelegramUser();
    renderCards();
    fetchRates();
    document.body.addEventListener('click', handleGlobalClick);
    
    const s1 = document.getElementById('from-currency');
    const s2 = document.getElementById('to-currency');
    if (s1) s1.onchange = convertCurrency;
    if (s2) s2.onchange = convertCurrency;
};
