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

// ОБРАБОТКА КЛАВИАТУРЫ (Исправление перекрытия)
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

function createNewRow() { 
    const list = document.getElementById('items-list');
    list.appendChild(createRowElement()); 
    // Скролл вниз при добавлении
    setTimeout(() => { list.scrollTop = list.scrollHeight; }, 50);
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(i => total += Number(i.value) || 0);
    document.getElementById('total-value').innerText = total.toLocaleString() + ' ₽';
}

// Остальные функции (renderCards, fetchRates, convertCurrency) остаются без изменений
// ... (скопируйте их из вашего исходного кода)

function handleGlobalClick(e) { 
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && !e.target.classList.contains('add-box-border')) {
        document.activeElement.blur(); 
    }
}

window.onload = () => {
    if (tg.initDataUnsafe?.user) {
        document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
        if (tg.initDataUnsafe.user.photo_url) document.getElementById('user-photo').src = tg.initDataUnsafe.user.photo_url;
    }
    fetchRates(); 
    renderCards();
};
