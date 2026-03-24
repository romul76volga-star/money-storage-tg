const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;

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
        <input type="number" class="item-price" placeholder="0" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true)" onblur="toggleUI(false)">
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

// СКРЫТИЕ ПЛАШЕК ПРИ КЛАВИАТУРЕ
function toggleUI(focused) {
    const nav = document.getElementById('bottom-nav');
    const controls = document.getElementById('counter-controls');
    if (focused) {
        nav.style.display = 'none';
        if (controls) controls.style.display = 'none';
    } else {
        // Задержка, чтобы элементы не прыгали раньше времени
        setTimeout(() => {
            nav.style.display = 'flex';
            if (controls) controls.style.display = 'block';
        }, 150);
    }
}

function handleGlobalClick(e) {
    if (e.target.tagName !== 'INPUT') document.activeElement.blur();
}

function clearData() {
    tg.showConfirm("Удалить всё?", (ok) => {
        if(ok) { localStorage.clear(); savedRecords = []; renderCards(); showScreen('screen-home', null, 0); }
    });
}

renderCards();
// --- ЛОГИКА КОНВЕРТЕРА ВАЛЮТ ---

// Переменная для хранения загруженных курсов
let exchangeRates = {};

// Базовая валюта API (обычно USD)
const apiBaseCurrency = 'USD';

// Функция получения актуальных курсов валют через API
async function fetchRates() {
    const rateDisplay = document.getElementById('current-rate-display');
    const timeDisplay = document.getElementById('rate-update-time');
    const updateBtn = document.querySelector('.update-rates-btn');

    try {
        // Пока идет загрузка, меняем текст
        rateDisplay.innerText = "updating...";
        updateBtn.disabled = true; // Отключаем кнопку

        // Используем бесплатный API er-api.com
        const response = await fetch(`https://open.er-api.com/v6/latest/${apiBaseCurrency}`);
        const data = await response.json();

        if (data && data.result === "success") {
            exchangeRates = data.rates;
            
            // Обновляем UI с временем последнего обновления
            const now = new Date();
            timeDisplay.innerText = `Updated at: ${now.toLocaleTimeString()}`;
            
            // Выполняем первую конвертацию
            convertCurrency();
        } else {
            throw new Error("Failed to load rates");
        }
    } catch (error) {
        console.error("Currency API Error:", error);
        rateDisplay.innerText = "Error loading rates";
        timeDisplay.innerText = "Check your internet connection";
    } finally {
        // В любом случае возвращаем кнопку в рабочее состояние
        updateBtn.disabled = false;
    }
}

// Функция мгновенной конвертации при вводе
function convertCurrency() {
    const fromAmountInput = document.getElementById('from-amount');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toAmountInput = document.getElementById('to-amount');
    const toCurrencySelect = document.getElementById('to-currency');
    const rateDisplay = document.getElementById('current-rate-display');

    // Если курсы еще не загружены, ничего не делаем
    if (Object.keys(exchangeRates).length === 0) return;

    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    const amount = parseFloat(fromAmountInput.value);

    // Обработка пустых или некорректных вводов
    if (isNaN(amount) || amount < 0) {
        toAmountInput.value = "";
        rateDisplay.innerText = "---";
        return;
    }

    // Если валюты одинаковые, результат равен вводу
    if (fromCurrency === toCurrency) {
        toAmountInput.value = amount;
        rateDisplay.innerText = `1 ${fromCurrency} = 1 ${toCurrency}`;
        return;
    }

    // Расчет через кросс-курс (оба курса к базовой валюте API, USD)
    // Formula: (Amount / RateFrom) * RateTo
    const amountInBase = amount / exchangeRates[fromCurrency];
    const convertedAmount = amountInBase * exchangeRates[toCurrency];

    // Вывод результата с округлением до 2 знаков
    toAmountInput.value = convertedAmount.toFixed(2);

    // Обновляем текст текущего курса для этой пары
    const oneUnitRate = (1 / exchangeRates[fromCurrency]) * exchangeRates[toCurrency];
    rateDisplay.innerText = `1 ${fromCurrency} = ${oneUnitRate.toFixed(4)} ${toCurrency}`;
}

// Функция смены валют местами (⇄)
function swapCurrencies() {
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');

    // Меняем местами выбранные валюты
    const tempCurrency = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = tempCurrency;

    // Опционально: можно поменять местами и суммы, но лучше оставить ввод сверху
    if (toAmountInput.value) {
        fromAmountInput.value = toAmountInput.value;
    }

    // Запускаем пересчет
    convertCurrency();
}

// Добавим вызов fetchRates() при инициализации приложения
// Убедись, что это выполняется после загрузки DOM
window.addEventListener('load', () => {
    // Твой существующий код старта приложения...
    renderCards();
    createNewRow();

    // Загружаем курсы валют
    fetchRates();
});
