const tg = window.Telegram.WebApp;
tg.expand();

let currentFocus = false;

// Прятать клавиатуру по тапу на пустое место
function dismissKeyboard(e) {
    if (e.target.tagName !== 'INPUT') {
        document.querySelectorAll('input').forEach(i => i.blur());
        setFocus(false);
    }
}

// Режим фокуса: прячем итог и меню при вводе
function setFocus(state) {
    currentFocus = state;
    const nav = document.getElementById('bottom-nav');
    const total = document.getElementById('total-bar');
    
    if (state) {
        nav.style.opacity = '0';
        setTimeout(() => nav.classList.add('hidden'), 300);
        if (total) total.classList.add('hidden');
    } else {
        nav.classList.remove('hidden');
        setTimeout(() => nav.style.opacity = '1', 10);
        if (total) total.classList.remove('hidden');
    }
}

function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Заголовок
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('header-title').innerText = titles[id];
    
    // Галочка (только в счетчике)
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

function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" onfocus="setFocus(true)" onblur="setFocus(false)">
        <input type="number" placeholder="цена" class="item-price" oninput="updateTotal()" onfocus="setFocus(true)" onblur="setFocus(false)">
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
    } catch { document.getElementById('conv-result').innerText = "error"; }
}

function openPicker(side) { 
    window.pickingSide = side; 
    document.getElementById('picker').classList.remove('hidden'); 
}
function closePicker() { document.getElementById('picker').classList.add('hidden'); }
function selectCurr(f, c) {
    document.getElementById(`${window.pickingSide}-flag`).innerText = f;
    document.getElementById(`${window.pickingSide}-code`).innerText = c;
    closePicker();
    convertCurrency();
}

// Telegram данные
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
    if(tg.initDataUnsafe.user.photo_url) document.getElementById('user-avatar').style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
}

function clearData() { localStorage.clear(); location.reload(); }
