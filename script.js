const tg = window.Telegram.WebApp;
tg.expand();

// Переключение экранов
function showScreen(id, el, idx) {
    // Скрываем все экраны принудительно
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Показываем нужный
    const target = document.getElementById(id);
    if(target) target.classList.add('active');

    // Заголовок и кнопка "Сохранить"
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-settings': 'Профиль' };
    document.getElementById('header-title').innerText = titles[id];
    document.getElementById('header-save').classList.toggle('hidden', id !== 'screen-counter');

    // Навигация
    if(idx !== undefined) {
        const positions = ['7.5%', '41%', '74.5%'];
        document.getElementById('tab-indicator').style.left = positions[idx];
    }
    if(el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

// Отрисовка главной
function renderCards() {
    const container = document.getElementById('cards-container');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-center">
                <button class="add-circle" onclick="showScreen('screen-counter', null, 1)">+</button>
                <div style="font-weight: bold; font-size: 20px">добавить</div>
            </div>`;
    } else {
        // Кнопка "+" в сетке
        const addCard = document.createElement('div');
        addCard.className = 'save-card glass';
        addCard.style.border = '2px dashed white';
        addCard.style.alignItems = 'center';
        addCard.style.justifyContent = 'center';
        addCard.innerHTML = '<span style="font-size: 30px">+</span>';
        addCard.onclick = () => showScreen('screen-counter', null, 1);
        container.appendChild(addCard);

        // Карточки истории
        [...history].reverse().forEach(item => {
            const card = document.createElement('div');
            card.className = 'save-card';
            card.innerHTML = `
                <div style="font-size: 12px; opacity: 0.6">${item.date}</div>
                <div style="font-size: 24px; font-weight: bold">${item.total}</div>
            `;
            container.appendChild(card);
        });
    }
}

// Логика счетчика
function addRow() {
    const list = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" class="item-name" placeholder="Товар">
        <input type="number" class="item-price" placeholder="0" oninput="calcTotal()">
    `;
    list.appendChild(div);
}

function calcTotal() {
    let sum = 0;
    document.querySelectorAll('.item-price').forEach(p => sum += Number(p.value) || 0);
    document.getElementById('total-value').innerText = sum;
}

// Сохранение
function saveAndHome() {
    const val = document.getElementById('total-value').innerText;
    if(val === "0") return;
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
    
    // Сброс
    document.getElementById('items-list').innerHTML = '';
    addRow();
    calcTotal();
    renderCards();
    closeModal();
    showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
}

function clearData() {
    if(confirm("Удалить всё?")) {
        localStorage.clear();
        location.reload();
    }
}

// Старт
addRow();
renderCards();
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}
