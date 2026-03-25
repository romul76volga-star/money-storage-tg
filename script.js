const tg = window.Telegram.WebApp;
tg.expand();

// Загрузка данных из памяти
let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;
let exchangeRates = {};

// --- ТЕМЫ ---
function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('user_theme', theme);
    const colors = { 'theme-green': '#5d6b5e', 'theme-black': '#000000', 'theme-white': '#ffffff' };
    tg.setHeaderColor(colors[theme] || '#5d6b5e');
    tg.setBackgroundColor(theme === 'theme-white' ? '#f5f5f5' : '#000000');
}

// Установка темы при старте
setTheme(localStorage.getItem('user_theme') || 'theme-green');

// --- НАВИГАЦИЯ ---
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(id);
    if (targetScreen) targetScreen.classList.add('active');
    
    const titles = { 
        'screen-home': 'Главная', 
        'screen-counter': 'Новый расчет', 
        'screen-converter': 'Конвертер', 
        'screen-settings': 'Профиль' 
    };
    
    document.getElementById('screen-title').innerText = titles[id] || 'MoneyStorage';
    
    // Показываем кнопку "Галочка" только на экране счетчика
    const headerAction = document.getElementById('header-action');
    if (headerAction) {
        headerAction.classList.toggle('hidden', id !== 'screen-counter');
    }

    // Двигаем индикатор в таб-баре
    const indicator = document.getElementById('tab-indicator');
    if (indicator && idx !== undefined) {
        indicator.style.left = `${(idx * 33.33) + 16.66}%`;
        indicator.style.transform = 'translateX(-50%)';
        document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
        if (el) el.classList.add('active');
    }

    if (id === 'screen-home') renderCards();
}

// --- ЛОГИКА ФАЙЛОВ (ГЛАВНЫЙ ЭКРАН) ---
function openFile(index) {
    currentEditingIndex = index;
    const listContainer = document.getElementById('items-list');
    
    if (index === -1) {
        // Создание нового файла
        listContainer.innerHTML = ''; // Очищаем список
        createNewRow(); // Добавляем первую пустую строку
        document.getElementById('total-value').innerText = '0';
        showScreen('screen-counter', document.querySelectorAll('.tab-item')[0], 0);
        document.getElementById('screen-title').innerText = 'Новый расчет';
    } else {
        // Редактирование существующего (если нужно)
        const record = savedRecords[index];
        // Тут можно добавить логику восстановления строк из record.data
        showScreen('screen-counter', document.querySelectorAll('.tab-item')[0], 0);
    }
}

// Сохранение и возврат домой (вызывается при нажатии на ✓)
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total === '0' || total === '') {
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
        return;
    }

    const newRecord = {
        date: new Date().toLocaleDateString(),
        total: total,
        timestamp: Date.now()
    };

    if (currentEditingIndex === -1) {
        savedRecords.unshift(newRecord); // Добавляем в начало
    } else {
        savedRecords[currentEditingIndex] = newRecord;
    }

    localStorage.setItem('money_logs', JSON.stringify(savedRecords));
    showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
}

// Добавление строки в счетчике
function createNewRow() {
    const list = document.getElementById('items-list');
    const row = document.createElement('div');
    row.className = 'conv-row'; // Используем готовый стиль из CSS
    row.style.marginBottom = '10px';
    row.innerHTML = `
        <input type="number" class="conv-input counter-input" placeholder="0" oninput="calculateTotal()">
        <span style="margin-left: 10px; opacity: 0.5">₽</span>
    `;
    list.appendChild(row);
}

function calculateTotal() {
    let sum = 0;
    document.querySelectorAll('.counter-input').forEach(input => {
        sum += parseFloat(input.value) || 0;
    });
    document.getElementById('total-value').innerText = sum.toLocaleString();
}

// --- КОНВЕРТЕР (API) ---
async function fetchRates() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.result === "success") {
            exchangeRates = data.rates;
            const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            document.getElementById('rate-update-time').innerText = `Обновлено: ${time}`;
            convertCurrency();
        }
    } catch (e) {
        document.getElementById('current-rate-display').innerText = "Ошибка сети";
    }
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

// --- ОТРИСОВКА КАРТОЧЕК ---
function renderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;
    
    // Кнопка создания (+)
    container.innerHTML = `
        <div class="history-card" style="border: 2px dashed rgba(128,128,128,0.3); background: transparent;" onclick="openFile(-1)">
            <span style="font-size:40px; opacity:0.3; color: var(--text)">+</span>
        </div>
    `;
    
    // Список сохраненных файлов
    savedRecords.forEach((rec, idx) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.onclick = () => openFile(idx);
        card.innerHTML = `
            <div style="font-size: 12px; opacity: 0.6; margin-bottom: 5px;">${rec.date}</div>
            <div class="card-sum">${rec.total} ₽</div>
        `;
        container.appendChild(card);
    });
}

function clearData() {
    if(confirm("Удалить все записи?")) {
        savedRecords = [];
        localStorage.removeItem('money_logs');
        renderCards();
    }
}

// Загрузка данных пользователя из Telegram
function loadUser() {
    if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        document.getElementById('user-name').innerText = u.first_name || "Пользователь";
        if (u.photo_url) document.getElementById('user-photo').src = u.photo_url;
    } else {
        document.getElementById('user-name').innerText = "Developer";
    }
}

window.onload = () => {
    loadUser();
    fetchRates();
    renderCards();
};
