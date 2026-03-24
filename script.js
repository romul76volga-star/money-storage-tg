const tg = window.Telegram.WebApp;
tg.expand();

function dismissKeyboard(e) {
    if (e.target.tagName !== 'INPUT') {
        document.querySelectorAll('input').forEach(i => i.blur());
    }
}

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
    
    // Галочка только в счетчике
    document.getElementById('header-save').classList.toggle('hidden', id !== 'screen-counter');

    // Индикатор двигается только если нажат элемент меню (idx передан)
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
    // Цена теперь идет после названия в структуре, но позиционируется поверх CSS
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name">
        <input type="number" placeholder="0" class="item-price" oninput="updateTotal()">
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

// Инициализация первой строки
createNewRow();

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

function saveAndHome() {
    const val = document.getElementById('total-value').innerText;
    localStorage.setItem('last_total', val);
    tg.HapticFeedback.notificationOccurred('success');
    
    // Возврат на главную через первую иконку
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
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
    } catch { 
        document.getElementById('conv-result').innerText = "0.00"; 
    }
}

function openPicker(side) { 
    window.pickingSide = side; 
    document.getElementById('picker').classList.remove('hidden'); 
}

function closePicker() { document.getElementById('picker').classList.add('hidden'); }

function selectCurr(f, c) {
    const side = window.pickingSide;
    document.getElementById(`${side}-flag`).innerText = f;
    document.getElementById(`${side}-code`).innerText = c;
    closePicker();
    convertCurrency();
}

// Данные профиля
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
    if(tg.initDataUnsafe.user.photo_url) {
        document.getElementById('user-avatar').style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
    }
}

function clearData() { localStorage.clear(); location.reload(); }
