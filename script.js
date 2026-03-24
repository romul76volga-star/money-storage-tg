const tg = window.Telegram.WebApp;
tg.expand();

let currentEditingId = null; // Храним ID редактируемой записи

// UI логика
function toggleUI(isFocused, element = null) {
    const totalBar = document.getElementById('total-bar');
    const bottomNav = document.getElementById('bottom-nav');
    const scrollContainer = document.querySelector('.scroll-container');
    
    if (isFocused) {
        if (totalBar) totalBar.classList.add('v-hide');
        bottomNav.classList.add('v-hide');
        if (scrollContainer) scrollContainer.classList.add('full-height');
        if (element) {
            setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        }
    } else {
        setTimeout(() => {
            if (document.activeElement.tagName !== 'INPUT') {
                if (totalBar) totalBar.classList.remove('v-hide');
                bottomNav.classList.remove('v-hide');
                if (scrollContainer) scrollContainer.classList.remove('full-height');
            }
        }, 150);
    }
}

function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    screen.classList.add('active');
    
    if (id !== 'screen-counter') currentEditingId = null; // Сброс ID если ушли со счетчика

    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('header-title').innerText = titles[id];
    document.getElementById('header-save').classList.toggle('hidden', id !== 'screen-counter');

    if (idx !== undefined) moveIndicator(idx);
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

function moveIndicator(idx) {
    const pos = ['7.5%', '41%', '74.5%'];
    document.getElementById('tab-indicator').style.left = pos[idx];
}

// Работа со списком
function createNewRow(name = '', price = '') {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
        <input type="number" placeholder="0" class="item-price" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
    `;
    container.appendChild(div);

    const pInput = div.querySelector('.item-price');
    pInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            createNewRow();
            setTimeout(() => {
                const rows = document.querySelectorAll('.item-name');
                rows[rows.length - 1].focus();
            }, 50);
        }
    });
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

// Сохранение и Удаление
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total === "0") return;
    document.getElementById('modal-total-value').innerText = total;
    
    const hint = document.getElementById('modal-hint');
    hint.innerText = currentEditingId ? "✕ удалит эту запись" : "✕ сбросит текущий ввод";
    
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function confirmSave() {
    const items = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const n = row.querySelector('.item-name').value;
        const p = row.querySelector('.item-price').value;
        if (n || p) items.push({ name: n, price: p });
    });

    let history = JSON.parse(localStorage.getItem('money_history') || '[]');
    
    if (currentEditingId) {
        // Обновляем существующую
        const idx = history.findIndex(x => x.id === currentEditingId);
        if (idx !== -1) {
            history[idx].total = document.getElementById('total-value').innerText;
            history[idx].items = items;
        }
    } else {
        // Создаем новую
        history.push({
            id: Date.now(),
            date: new Date().toLocaleDateString('ru-RU'),
            total: document.getElementById('total-value').innerText,
            items: items
        });
    }

    localStorage.setItem('money_history', JSON.stringify(history));
    finishAction();
}

function cancelSave() {
    if (currentEditingId) {
        // Если мы редактировали файл и нажали крестик - удаляем его
        let history = JSON.parse(localStorage.getItem('money_history') || '[]');
        history = history.filter(x => x.id !== currentEditingId);
        localStorage.setItem('money_history', JSON.stringify(history));
    }
    finishAction();
}

function finishAction() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('items-list').innerHTML = '';
    document.getElementById('total-value').innerText = '0';
    currentEditingId = null;
    createNewRow();
    renderCards();
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
}

function renderCards() {
    const container = document.getElementById('cards-container');
    const screenHome = document.getElementById('screen-home');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        screenHome.classList.add('empty');
        container.innerHTML = `
            <div class="center-content">
                <button class="add-btn-glass" onclick="showScreen('screen-counter')"><img src="assets/plus.png"></button>
                <div class="bold-label">добавить</div>
            </div>`;
    } else {
        screenHome.classList.remove('empty');
        [...history].reverse().forEach(data => {
            const card = document.createElement('div');
            card.className = 'save-card';
            card.onclick = () => loadSavedData(data);
            card.innerHTML = `<div class="card-date">${data.date}</div><div class="card-amount">${data.total}</div>`;
            container.appendChild(card);
        });
        const addCard = document.createElement('div');
        addCard.className = 'save-card center-content';
        addCard.style.background = 'var(--glass)';
        addCard.style.border = '2px dashed white';
        addCard.innerHTML = '<span style="font-size:40px">+</span>';
        addCard.onclick = () => showScreen('screen-counter');
        container.appendChild(addCard);
    }
}

function loadSavedData(data) {
    currentEditingId = data.id;
    document.getElementById('items-list').innerHTML = '';
    data.items.forEach(item => createNewRow(item.name, item.price));
    updateTotal();
    showScreen('screen-counter');
}

// Конвертер
async function convertCurrency() {
    const val = document.getElementById('conv-input').value;
    const f = document.getElementById('from-code').innerText;
    const t = document.getElementById('to-code').innerText;
    if(!val) return;
    try {
        const r = await fetch(`https://api.exchangerate-api.com/v4/latest/${f}`);
        const d = await r.json();
        document.getElementById('conv-result').innerText = (val * d.rates[t]).toFixed(2);
    } catch { document.getElementById('conv-result').innerText = "0.00"; }
}

function openPicker(side) { window.pickingSide = side; document.getElementById('picker').classList.remove('hidden'); }
function closePicker() { document.getElementById('picker').classList.add('hidden'); }
function selectCurr(f, c) {
    const side = window.pickingSide;
    document.getElementById(`${side}-flag`).innerText = f;
    document.getElementById(`${side}-code`).innerText = c;
    closePicker(); convertCurrency();
}

// Инит
createNewRow();
renderCards();
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
    if(tg.initDataUnsafe.user.photo_url) document.getElementById('user-avatar').style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
}
function clearData() { localStorage.clear(); location.reload(); }
