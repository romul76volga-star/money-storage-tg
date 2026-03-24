const tg = window.Telegram.WebApp;
tg.expand();

// Скрытие клавиатуры
function dismissKeyboard(e) {
    if (e.target.tagName !== 'INPUT') {
        document.querySelectorAll('input').forEach(i => i.blur());
        setFocus(false);
    }
}

function setFocus(state) {
    const nav = document.getElementById('bottom-nav');
    const total = document.getElementById('total-bar');
    if (state) {
        nav.style.transform = 'translate(-50%, 150%)'; // Уводим вниз плавно
        if (total) total.style.transform = 'translateY(150%)';
    } else {
        nav.style.transform = 'translate(-50%, 0)';
        if (total) total.style.transform = 'translateY(0)';
    }
}

function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('header-title').innerText = titles[id];
    
    // Показываем галочку ТОЛЬКО в счетчике
    document.getElementById('header-save').classList.toggle('hidden', id !== 'screen-counter');

    // Если idx не передан (нажали на плюс), индикатор НЕ двигается
    if (idx !== undefined) moveIndicator(idx);
    
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

function moveIndicator(idx) {
    const pos = ['7.8%', '41.5%', '75%'];
    document.getElementById('tab-indicator').style.left = pos[idx];
}

function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="Название..." class="item-name" onfocus="setFocus(true)" onblur="setFocus(false)">
        <input type="number" placeholder="Цена" class="item-price" oninput="updateTotal()" onfocus="setFocus(true)" onblur="setFocus(false)">
    `;
    container.appendChild(div);

    div.querySelector('.item-price').addEventListener('keydown', (e) => {
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
createNewRow();

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

// ГАЛОЧКА: Сохранение данных
function saveAndHome() {
    const val = document.getElementById('total-value').innerText;
    if (val === "0") return;
    
    localStorage.setItem('last_total', val);
    tg.HapticFeedback.notificationOccurred('success');
    
    // Возврат на главную
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
    updateHomeUI();
}

function updateHomeUI() {
    const last = localStorage.getItem('last_total');
    if (last) {
        const view = document.getElementById('saved-data-view');
        document.getElementById('empty-view')?.classList.add('hidden');
        view.classList.remove('hidden');
        view.innerHTML = `<h1 style="font-size:50px">${last} ₽</h1><p>Сохранено</p>`;
    }
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
    } catch { }
}

function openPicker(side) { window.pickingSide = side; document.getElementById('picker').classList.remove('hidden'); }
function closePicker() { document.getElementById('picker').classList.add('hidden'); }
function selectCurr(f, c) {
    document.getElementById(`${window.pickingSide}-flag`).innerText = f;
    document.getElementById(`${window.pickingSide}-code`).innerText = c;
    closePicker();
    convertCurrency();
}

// Telegram
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
    if(tg.initDataUnsafe.user.photo_url) document.getElementById('user-avatar').style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
}
function clearData() { localStorage.clear(); location.reload(); }
updateHomeUI();
