const tg = window.Telegram.WebApp;
tg.expand();

// Закрытие клавиатуры
document.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'INPUT') document.activeElement.blur();
});

// НАВИГАЦИЯ
function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const titles = { 
        'screen-home': 'Главная', 
        'screen-counter': 'Счетчик', 
        'screen-converter': 'Конвертер', 
        'screen-settings': 'Профиль' 
    };
    
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
    if (id === 'screen-home') renderCards();
}

// СЧЕТЧИК
function createNewRow(name = '', price = '') {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}" onfocus="toggleUI(true)" onblur="toggleUI(false)">
        <input type="number" placeholder="0" class="item-price" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true)" onblur="toggleUI(false)">
    `;
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

function toggleUI(focused) {
    const nav = document.getElementById('bottom-nav');
    const total = document.getElementById('total-bar');
    if (focused) {
        nav.classList.add('v-hide');
        total.classList.add('on-keyboard');
    } else {
        setTimeout(() => {
            nav.classList.remove('v-hide');
            total.classList.remove('on-keyboard');
        }, 100);
    }
}

// МОДАЛЬНОЕ ОКНО
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total === "0") return;
    document.getElementById('modal-total-value').innerText = total;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeSaveModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function confirmSave() {
    const total = document.getElementById('total-value').innerText;
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    history.push({ id: Date.now(), date: new Date().toLocaleDateString(), total: total });
    localStorage.setItem('money_history', JSON.stringify(history));
    
    closeSaveModal();
    clearCounter();
    showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
}

function clearCounter() {
    document.getElementById('items-list').innerHTML = '';
    document.getElementById('total-value').innerText = '0';
    createNewRow();
}

// ГЛАВНАЯ (КАРТОЧКИ)
function renderCards() {
    const container = document.getElementById('cards-container');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    container.innerHTML = '';
    history.reverse().forEach(data => {
        const card = document.createElement('div');
        card.className = 'save-card';
        card.innerHTML = `<div class="card-date">${data.date}</div><div class="card-amount">${data.total}</div>`;
        container.appendChild(card);
    });
}

// Инициализация
createNewRow();
renderCards();
