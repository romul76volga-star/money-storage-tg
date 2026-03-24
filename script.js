const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;

function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('screen-title').innerText = titles[id];
    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');

    // Перемещаем кружок только если переключение идет через меню
    if (idx !== undefined) {
        const positions = ['16.5%', '50%', '83.5%'];
        const indicator = document.getElementById('tab-indicator');
        indicator.style.left = positions[idx];
        indicator.style.transform = 'translateX(-50%)';
        
        document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
        if (el) el.classList.add('active');
    }

    if (id === 'screen-home') renderCards();
}

function openFile(index) {
    currentEditingIndex = index;
    const list = document.getElementById('items-list');
    list.innerHTML = '';
    
    if (index === -1) {
        createNewRow();
        document.getElementById('total-value').innerText = '0';
    } else {
        const data = savedRecords[index];
        data.items.forEach(item => {
            list.appendChild(createRowElement(item.name, item.price));
        });
        updateTotal();
    }
    // ВАЖНО: При открытии счетчика кружок ОСТАЕТСЯ на главной (индекс 0)
    showScreen('screen-counter', null, 0); 
}

function createRowElement(name = '', price = '') {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}" onfocus="toggleUI(true)" onblur="toggleUI(false)">
        <input type="number" class="item-price" placeholder="0" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true)" onblur="toggleUI(false)">
    `;
    return row;
}

function createNewRow() {
    const list = document.getElementById('items-list');
    list.appendChild(createRowElement());
    setTimeout(() => list.scrollTo({top: list.scrollHeight, behavior: 'smooth'}), 50);
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(i => total += Number(i.value) || 0);
    document.getElementById('total-value').innerText = total;
}

function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    const items = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const n = row.querySelector('.item-name').value;
        const p = row.querySelector('.item-price').value;
        if (n || p) items.push({ name: n, price: p });
    });

    if (items.length > 0) {
        const record = { 
            date: currentEditingIndex === -1 ? new Date().toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit'}) : savedRecords[currentEditingIndex].date, 
            total, items 
        };
        if (currentEditingIndex === -1) savedRecords.unshift(record);
        else savedRecords[currentEditingIndex] = record;
        
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
    }
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    
    // Кнопка создания новой папки (тоже квадратная)
    const addCard = document.createElement('div');
    addCard.className = 'history-card';
    addCard.style.justifyContent = 'center';
    addCard.style.alignItems = 'center';
    addCard.onclick = () => openFile(-1);
    addCard.innerHTML = `<div style="font-size:40px; opacity:0.5;">+</div>`;
    container.appendChild(addCard);

    savedRecords.forEach((rec, index) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.onclick = () => openFile(index);
        card.innerHTML = `
            <div style="opacity:0.6; font-size:12px;">${rec.date}</div>
            <div class="card-sum">${rec.total} ₽</div>
            <button class="del-btn" onclick="deleteCard(${index}, event)">✕</button>
        `;
        container.appendChild(card);
    });
}

function toggleUI(focused) {
    const nav = document.getElementById('bottom-nav');
    if (focused) nav.classList.add('ui-hidden');
    else setTimeout(() => nav.classList.remove('ui-hidden'), 200);
}

function deleteCard(idx, e) {
    e.stopPropagation();
    tg.showConfirm("Удалить этот список?", (ok) => {
        if(ok) {
            savedRecords.splice(idx, 1);
            localStorage.setItem('money_logs', JSON.stringify(savedRecords));
            renderCards();
        }
    });
}

function handleGlobalClick(e) {
    if (e.target.tagName !== 'INPUT') document.activeElement.blur();
}

renderCards();
