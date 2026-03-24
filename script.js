const tg = window.Telegram.WebApp;
tg.expand();

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
    if (id === 'screen-home') renderCards();
}

function toggleUI(isFocused) {
    const nav = document.getElementById('bottom-nav');
    const total = document.getElementById('total-bar');
    if (isFocused) {
        nav.style.display = 'none';
        if (total) total.style.display = 'none';
    } else {
        setTimeout(() => {
            nav.style.display = 'flex';
            if (total) total.style.display = 'block';
        }, 100);
    }
}

// СТИЛЬ СТРОК КАК В ОРИГИНАЛЕ
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

function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    document.getElementById('modal-total-value').innerText = total;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeSaveModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

function confirmSave() {
    closeSaveModal();
    // Логика сохранения...
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = `
        <div class="center-content">
            <button class="add-btn-glass" onclick="showScreen('screen-counter')"><img src="assets/plus.png"></button>
            <div class="bold-label">добавить</div>
        </div>`;
}

createNewRow();
renderCards();
