const tg = window.Telegram.WebApp;
tg.expand();

document.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        document.activeElement.blur();
    }
});

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
        const pos = ['8%', '41%', '74%'];
        document.getElementById('tab-indicator').style.left = pos[idx];
    }
    
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
    if (id === 'screen-home') renderCards();
}

// Полное скрытие навигации и плашки суммы при вводе
function toggleUI(isFocused) {
    const bottomNav = document.getElementById('bottom-nav');
    const totalBar = document.getElementById('total-bar');
    
    if (isFocused) {
        bottomNav.style.display = 'none';
        if (totalBar) totalBar.style.display = 'none';
    } else {
        setTimeout(() => {
            bottomNav.style.display = 'flex';
            if (totalBar) totalBar.style.display = 'block';
        }, 150);
    }
}

function createNewRow(name = '', price = '') {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}" onfocus="toggleUI(true)" onblur="toggleUI(false)">
        <input type="number" placeholder="0" class="item-price" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true)" onblur="toggleUI(false)">
    `;
    container.appendChild(div);
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

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
    // Тут твоя логика localStorage...
    closeSaveModal();
    clearCounter();
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
}

function clearCounter() {
    document.getElementById('items-list').innerHTML = '';
    document.getElementById('total-value').innerText = '0';
    createNewRow();
}

// Инициализация
createNewRow();
