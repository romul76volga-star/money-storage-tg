// 1. Инициализация Telegram
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// 2. Переключение экранов
function showScreen(screenId, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    // Подсветка кнопок в меню
    if(el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

// 3. Логика счетчика (создание строк)
function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="Товар..." class="item-name">
        <input type="number" placeholder="0" class="item-price" oninput="updateTotal()">
    `;
    container.appendChild(div);

    // Логика нажатия Enter: создаем новую строку и переходим на неё
    const inputs = div.querySelectorAll('input');
    inputs[1].addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            createNewRow();
            setTimeout(() => {
                const allNames = document.querySelectorAll('.item-name');
                allNames[allNames.length - 1].focus();
            }, 50);
        }
    });
}

// Создаем первые 3 пустые строки при запуске
for(let i=0; i<3; i++) { createNewRow(); }

// 4. Подсчет общей суммы
function updateTotal() {
    let total = 0;
    const prices = document.querySelectorAll('.item-price');
    prices.forEach(input => {
        total += Number(input.value) || 0;
    });
    document.getElementById('total-value').innerText = total;
}

// 5. Конвертер валют
let pickingSide = 'from';

function openCurrencyPicker(side) {
    pickingSide = side;
    document.getElementById('currency-picker').classList.remove('hidden');
}

function closeCurrencyPicker() {
    document.getElementById('currency-picker').classList.add('hidden');
}

function selectCurrency(flag, code) {
    document.getElementById(`${pickingSide}-flag`).innerText = flag;
    document.getElementById(`${pickingSide}-code`).innerText = code;
    closeCurrencyPicker();
    convertCurrency();
}

async function convertCurrency() {
    const amt = document.getElementById('conv-input').value;
    const from = document.getElementById('from-code').innerText;
    const to = document.getElementById('to-code').innerText;
    
    if(!amt) return;

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const data = await response.json();
        const rate = data.rates[to];
        const res = (amt * rate).toFixed(2);
        document.getElementById('conv-result').innerText = `≈ ${res} ${to}`;
    } catch (error) {
        document.getElementById('conv-result').innerText = "Курс недоступен";
    }
}

// 6. Сохранение данных (localStorage)
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if(total == "0") {
        tg.showAlert("Введите сумму больше 0!");
        return;
    }
    
    localStorage.setItem('user_total_save', total);
    renderHome();
    showScreen('screen-home');
    tg.HapticFeedback.notificationOccurred('success'); // Вибрация при успехе
}

function renderHome() {
    const saved = localStorage.getItem('user_total_save');
    const emptyView = document.getElementById('empty-view');
    const savedView = document.getElementById('saved-data-view');

    if(saved) {
        emptyView.classList.add('hidden');
        savedView.classList.remove('hidden');
        savedView.innerHTML = `
            <div class="glass" style="padding: 30px; text-align: center; width: 90%;">
                <p style="opacity: 0.7; margin: 0;">Последние затраты:</p>
                <h1 style="font-size: 50px; margin: 10px 0;">${saved} ₽</h1>
                <button onclick="clearData()" style="background: none; border: 1px solid white; color: white; padding: 10px 20px; border-radius: 12px;">Очистить</button>
            </div>
        `;
    }
}

function clearData() {
    localStorage.removeItem('user_total_save');
    location.reload();
}

// 7. Профиль (Данные из Телеграм)
if(tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    document.getElementById('user-name').innerText = user.first_name || "Пользователь";
    if(user.photo_url) {
        document.getElementById('user-avatar').style.backgroundImage = `url(${user.photo_url})`;
    }
}

// Запуск функций при старте
renderHome();
convertCurrency();
