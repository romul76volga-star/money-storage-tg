const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');
let currentEditingIndex = -1;

function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('screen-title').innerText = titles[id] || '';
    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');

    if (idx !== undefined) {
        const positions = ['16.5%', '50%', '83.5%'];
        document.getElementById('tab-indicator').style.left = positions[idx];
        document.getElementById('tab-indicator').style.transform = 'translateX(-50%)';
    }

    if (el) {
        document.querySelectorAll('.tab-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }

    if (id === 'screen-home') renderCards();
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    if (savedRecords.length === 0) {
        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh;" onclick="openFile(-1)">
                <div style="width:100px; height:100px; border:2px solid white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:50px; margin-bottom:10px;">+</div>
                <div style="font-weight:bold;">добавить</div>
            </div>`;
    } else {
        savedRecords.forEach((rec, index) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.onclick = () => openFile(index);
            card.innerHTML = `
                <div class="card-date">${rec.date}</div>
                <div class="card-sum">${rec.total} RUB</div>
                <button class="del-btn" onclick="deleteCard(${index}, event)">✕</button>
            `;
            container.appendChild(card);
        });
        
        const addBtn = document.createElement('div');
        addBtn.className = 'add-box-border';
        addBtn.style.height = '100px';
        addBtn.innerHTML = '+';
        addBtn.onclick = () => openFile(-1);
        container.appendChild(addBtn);
    }
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
            const row = createRowElement(item.name, item.price);
            list.appendChild(row);
        });
        updateTotal();
    }
    showScreen('screen-counter', null, 1);
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
    document.getElementById('items-list').appendChild(createRowElement());
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
            date: currentEditingIndex === -1 ? new Date().toLocaleDateString() : savedRecords[currentEditingIndex].date, 
            total, items 
        };
        if (currentEditingIndex === -1) savedRecords.unshift(record);
        else savedRecords[currentEditingIndex] = record;
        
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
    }
}

function deleteCard(idx, e) {
    e.stopPropagation();
    if (confirm("Удалить файл?")) {
        savedRecords.splice(idx, 1);
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        renderCards();
    }
}

function toggleUI(f) {
    const nav = document.getElementById('bottom-nav');
    if (f) nav.classList.add('ui-hidden');
    else setTimeout(() => nav.classList.remove('ui-hidden'), 150);
}

function handleGlobalClick(e) {
    if (e.target.tagName !== 'INPUT') document.activeElement.blur();
}

function clearData() {
    if(confirm("Стереть всё?")) { localStorage.clear(); location.reload(); }
}

renderCards();
