const tg = window.Telegram.WebApp;
tg.expand();

// Навигация
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
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

// Работа со счетчиком
function createNewRow(name = '', price = '') {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}">
        <input type="number" placeholder="0" class="item-price" value="${price}" oninput="updateTotal()">
    `;
    container.appendChild(div);
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

// Сохранение
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total === "0") return;
    document.getElementById('modal-total-value').innerText = total;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function confirmSave() {
    const items = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const n = row.querySelector('.item-name').value;
        const p = row.querySelector('.item-price').value;
        if (n || p) items.push({ name: n, price: p });
    });

    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    history.push({
        id: Date.now(),
        date: new Date().toLocaleDateString('ru-RU'),
        total: document.getElementById('total-value').innerText,
        items: items
    });

    localStorage.setItem('money_history', JSON.stringify(history));
    resetCounter();
    renderCards();
    closeModal();
    showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
}

function resetCounter() {
    document.getElementById('items-list').innerHTML = '';
    document.getElementById('total-value').innerText = '0';
    createNewRow();
}

// Отрисовка главной
function renderCards() {
    const container = document.getElementById('cards-container');
    const screenHome = document.getElementById('screen-home');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    
    container.innerHTML = ''; 

    if (history.length === 0) {
        screenHome.classList.add('is-empty');
        container.innerHTML = `
            <div class="empty-state">
                <button class="add-btn-round" onclick="showScreen('screen-counter')"><img src="assets/plus.png"></button>
                <div class="bold-label">добавить</div>
            </div>`;
    } else {
        screenHome.classList.remove('is-empty');
        // Сначала кнопка «+» в виде карточки
        const addCard = document.createElement('div');
        addCard.className = 'save-card glass';
        addCard.style.border = '2px dashed white';
        addCard.style.justifyContent = 'center';
        addCard.style.alignItems = 'center';
        addCard.innerHTML = '<span style="font-size:40px">+</span>';
        addCard.onclick = () => showScreen('screen-counter');
        container.appendChild(addCard);

        // Затем история
        [...history].reverse().forEach(data => {
            const card = document.createElement('div');
            card.className = 'save-card';
            card.innerHTML = `<div class="card-date">${data.date}</div><div class="card-amount">${data.total}</div>`;
            container.appendChild(card);
        });
    }
}

function clearData() {
    if(confirm("Удалить всю историю?")) {
        localStorage.clear();
        location.reload();
    }
}

// Инициализация
resetCounter();
renderCards();

if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}
