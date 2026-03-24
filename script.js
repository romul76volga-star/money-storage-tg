const tg = window.Telegram.WebApp;
tg.expand();

// Переключение экранов
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('header-title').innerText = titles[id];
    document.getElementById('header-save').classList.toggle('hidden', id !== 'screen-counter');

    if (idx !== undefined) {
        const pos = ['7.5%', '41%', '74.5%'];
        document.getElementById('tab-indicator').style.left = pos[idx];
    }
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

// Отрисовка карточек
function renderCards() {
    const container = document.getElementById('cards-container');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-center">
                <button class="add-btn-glass" onclick="showScreen('screen-counter', null, 1)">
                    <img src="assets/plus.png">
                </button>
                <div style="font-weight: 900; font-size: 20px">добавить</div>
            </div>`;
    } else {
        // Кнопка "+" в сетке
        const addCard = document.createElement('div');
        addCard.className = 'save-card glass';
        addCard.style.border = '2px dashed white';
        addCard.style.alignItems = 'center';
        addCard.style.justifyContent = 'center';
        addCard.innerHTML = '<span style="font-size:40px">+</span>';
        addCard.onclick = () => showScreen('screen-counter', null, 1);
        container.appendChild(addCard);

        [...history].reverse().forEach(data => {
            const card = document.createElement('div');
            card.className = 'save-card';
            card.innerHTML = `<div class="card-date">${data.date}</div><div class="card-amount">${data.total}</div>`;
            container.appendChild(card);
        });
    }
}

// Счетчик
function addRow() {
    const list = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name">
        <input type="number" placeholder="0" class="item-price" oninput="updateTotal()">
    `;
    list.appendChild(div);
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

// Сохранение
function saveAndHome() {
    const val = document.getElementById('total-value').innerText;
    if (val === "0") return;
    document.getElementById('modal-total-value').innerText = val;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

function confirmSave() {
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    history.push({
        date: new Date().toLocaleDateString('ru-RU'),
        total: document.getElementById('total-value').innerText
    });
    localStorage.setItem('money_history', JSON.stringify(history));
    
    document.getElementById('items-list').innerHTML = '';
    addRow();
    updateTotal();
    renderCards();
    closeModal();
    showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
}

// Конвертер
async function convertCurrency() {
    const val = document.getElementById('conv-input').value;
    const from = document.getElementById('from-code').innerText;
    const to = document.getElementById('to-code').innerText;
    try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
        const data = await res.json();
        document.getElementById('conv-result').innerText = (val * data.rates[to]).toFixed(2);
    } catch { document.getElementById('conv-result').innerText = "error"; }
}

function openPicker(side) { window.currentSide = side; document.getElementById('picker').classList.remove('hidden'); }
function closePicker() { document.getElementById('picker').classList.add('hidden'); }
function selectCurr(flag, code) {
    document.getElementById(`${window.currentSide}-flag`).innerText = flag;
    document.getElementById(`${window.currentSide}-code`).innerText = code;
    closePicker(); convertCurrency();
}

function clearData() {
    if(confirm("Удалить всё?")) { localStorage.clear(); location.reload(); }
}

// Инициализация
addRow();
renderCards();
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}
