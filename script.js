const tg = window.Telegram.WebApp;
tg.expand();

function toggleUI(isFocused, element = null) {
    const totalBar = document.getElementById('total-bar');
    const bottomNav = document.getElementById('bottom-nav');
    const scrollContainer = document.querySelector('.scroll-container');
    
    if (isFocused) {
        if (totalBar) totalBar.classList.add('v-hide');
        bottomNav.classList.add('v-hide');
        if (scrollContainer) scrollContainer.classList.add('full-height');
        
        // Умный скролл к выбранной строке
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
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

function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" 
               onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
        <input type="number" placeholder="0" class="item-price" 
               oninput="updateTotal()" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
    `;
    container.appendChild(div);

    const priceInput = div.querySelector('.item-price');
    priceInput.addEventListener('keydown', (e) => {
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

function saveAndHome() {
    const val = document.getElementById('total-value').innerText;
    localStorage.setItem('last_total', val);
    tg.HapticFeedback.notificationOccurred('success');
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
}

// Конвертер
const convInput = document.getElementById('conv-input');
if(convInput) {
    convInput.addEventListener('focus', () => toggleUI(true, convInput));
    convInput.addEventListener('blur', () => toggleUI(false));
}

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

function openPicker(side) { window.pickingSide = side; document.getElementById('picker').classList.remove('hidden'); }
function closePicker() { document.getElementById('picker').classList.add('hidden'); }
function selectCurr(f, c) {
    const side = window.pickingSide;
    document.getElementById(`${side}-flag`).innerText = f;
    document.getElementById(`${side}-code`).innerText = c;
    closePicker();
    convertCurrency();
}

if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
    if(tg.initDataUnsafe.user.photo_url) {
        document.getElementById('user-avatar').style.backgroundImage = `url(${tg.initDataUnsafe.user.photo_url})`;
    }
}

function clearData() { localStorage.clear(); location.reload(); }
