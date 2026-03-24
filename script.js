const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// 1. Плавный индикатор меню
function moveIndicator(index) {
    const indicator = document.getElementById('tab-indicator');
    const positions = ['7.5%', '41%', '74.5%']; // Координаты для прыжка кружка
    indicator.style.left = positions[index];
}

// 2. Переключение экранов
function showScreen(screenId, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if(el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        // Автоматически двигаем индикатор при смене экрана
        const index = Array.from(el.parentNode.children).indexOf(el) - 1; // -1 из-за индикатора
        if(index >= 0) moveIndicator(index);
    }
}

// 3. Создание строк (одна за другой)
function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name">
        <input type="number" placeholder="цена" class="item-price" oninput="updateTotal()">
    `;
    container.appendChild(div);

    const priceInput = div.querySelector('.item-price');
    priceInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            createNewRow();
            setTimeout(() => {
                const names = document.querySelectorAll('.item-name');
                names[names.length - 1].focus();
            }, 10);
        }
    });
}

// Запуск первой строки
if(document.getElementById('items-list')) createNewRow();

// 4. Подсчет итога
function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(input => {
        total += Number(input.value) || 0;
    });
    document.getElementById('total-value').innerText = total;
}

// 5. Конвертер
async function convertCurrency() {
    const amt = document.getElementById('conv-input').value;
    const from = document.getElementById('from-code').innerText;
    const to = document.getElementById('to-code').innerText;
    if(!amt) return;
    try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const data = await res.json();
        const result = (amt * data.rates[to]).toFixed(2);
        document.getElementById('conv-result').innerText = `≈ ${result} ${to}`;
    } catch {
        document.getElementById('conv-result').innerText = "Ошибка курса";
    }
}

let pickingSide = 'from';
function openCurrencyPicker(side) { pickingSide = side; document.getElementById('currency-picker').classList.remove('hidden'); }
function closeCurrencyPicker() { document.getElementById('currency-picker').classList.add('hidden'); }
function selectCurrency(flag, code) {
    document.getElementById(`${pickingSide}-flag`).innerText = flag;
    document.getElementById(`${pickingSide}-code`).innerText = code;
    closeCurrencyPicker();
    convertCurrency();
}

// 6. Сохранение
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if(total === "0") return tg.showAlert("Сначала введите сумму!");
    localStorage.setItem('saved_money', total);
    tg.HapticFeedback.notificationOccurred('success');
    renderHome();
    showScreen('screen-home', document.querySelector('.tab-item:first-child'));
    moveIndicator(0);
}

function renderHome() {
    const saved = localStorage.getItem('saved_money');
    const view = document.getElementById('saved-data-view');
    const empty = document.getElementById('empty-view');
    if(saved) {
        empty.classList.add('hidden');
        view.classList.remove('hidden');
        view.innerHTML = `<div class="glass" style="padding:40px; text-align:center;">
            <p style="opacity:0.6">Последний итог:</p>
            <h1 style="font-size:45px; margin:10px 0;">${saved} ₽</h1>
            <button onclick="localStorage.clear(); location.reload();" style="background:none; border:1px solid white; color:white; padding:10px; border-radius:10px;">Сбросить</button>
        </div>`;
    }
}

// Данные пользователя Telegram
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
    if(tg.initDataUnsafe.user.photo_url) {
        document.getElementById('user-avatar').style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
    }
}

renderHome();
convertCurrency();
