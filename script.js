const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');

// Закрытие клавиатуры при тапе по пустому месту
function handleGlobalClick(e) {
    if (e.target.tagName !== 'INPUT') {
        document.activeElement.blur();
    }
}

function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(id);
    if(targetScreen) targetScreen.classList.add('active');
    
    // Титлы
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('header-title').innerText = titles[id] || 'Money App';
    
    // Кнопка сохранения только в счетчике
    document.getElementById('header-save').classList.toggle('hidden', id !== 'screen-counter');

    // Исправленный индикатор (кружок)
    if (idx !== undefined) {
        const indicator = document.getElementById('tab-indicator');
        const positions = ['16.5%', '50%', '83.5%']; 
        indicator.style.left = positions[idx];
        indicator.style.transform = 'translateX(-50%)';
    }

    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }

    if (id === 'screen-home') renderCards();
}

// Скрытие UI при печати
function toggleUI(isFocused) {
    const nav = document.getElementById('bottom-nav');
    const total = document.getElementById('total-bar');
    if (isFocused) {
        nav.classList.add('ui-hidden');
        if (total) total.classList.add('ui-hidden');
    } else {
        setTimeout(() => {
            nav.classList.remove('ui-hidden');
            if (total) total.classList.remove('ui-hidden');
        }, 100);
    }
}

function createNewRow(name = '', price = '') {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}" onfocus="toggleUI(true)" onblur="toggleUI(false)">
        <input type="number" class="item-price" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true)" onblur="toggleUI(false)">
    `;
    container.appendChild(div);
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = `
        <div class="add-btn-container">
            <button class="add-btn-glass" onclick="showScreen('screen-counter', null, 0)">+</button>
            <div class="bold-label">добавить</div>
        </div>`;
    
    savedRecords.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = 'history-card glass';
        card.innerHTML = `
            <div onclick="openOldRecord(${index})">
                <div class="card-date">${rec.date}</div>
                <div class="card-sum">${rec.total} RUB</div>
            </div>
            <button class="del-card-btn" onclick="deleteCard(${index})">✕</button>
        `;
        container.appendChild(card);
    });
}

function deleteCard(index) {
    savedRecords.splice(index, 1);
    localStorage.setItem('money_logs', JSON.stringify(savedRecords));
    renderCards();
}

function confirmSave() {
    const total = document.getElementById('total-value').innerText;
    if (total > 0) {
        const now = new Date();
        savedRecords.unshift({
            date: now.toLocaleDateString(),
            total: total,
            items: [] // здесь можно сохранять массив имен товаров
        });
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
    }
    closeSaveModal();
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
}

function saveAndHome() {
    updateTotal();
    document.getElementById('modal-total-value').innerText = document.getElementById('total-value').innerText;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeSaveModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

// Инициализация
createNewRow();
renderCards();
