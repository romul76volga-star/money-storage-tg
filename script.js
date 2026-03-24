const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');

function showScreen(id, el, idx) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Галочка только на экране счетчика
    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');
    
    // Заголовки
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-settings': 'Профиль' };
    document.getElementById('screen-title').innerText = titles[id] || '';

    // Индикатор меню
    if (idx !== undefined) {
        const positions = ['16.5%', '50%', '83.5%'];
        document.getElementById('tab-indicator').style.left = positions[idx];
        document.getElementById('tab-indicator').style.transform = 'translateX(-50%)';
    }

    if (id === 'screen-home') renderCards();
}

function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    if (savedRecords.length === 0) {
        // ВИД 1: Круглая кнопка (когда пусто)
        container.innerHTML = `
            <div class="first-add-wrapper" onclick="showScreen('screen-counter', null, 1)">
                <div class="big-circle-btn">+</div>
                <div style="font-weight:bold; font-size:18px;">добавить</div>
            </div>`;
    } else {
        // ВИД 2: Файлы + кнопка как на Скрине 2
        savedRecords.forEach((rec, index) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="card-date">${rec.date}</div>
                <div class="card-sum">${rec.total} RUB</div>
                <button class="del-btn" onclick="deleteCard(${index})">✕</button>
            `;
            container.appendChild(card);
        });

        const addPlate = document.createElement('div');
        addPlate.className = 'mini-add-plate';
        addPlate.innerHTML = '+';
        addPlate.onclick = () => showScreen('screen-counter', null, 1);
        container.appendChild(addPlate);
    }
}

function deleteCard(index) {
    // Подтверждение перед удалением
    if (confirm("Вы уверены, что хотите удалить этот файл?")) {
        savedRecords.splice(index, 1);
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        renderCards();
    }
}

function createNewRow() {
    const list = document.getElementById('items-list');
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" onfocus="toggleUI(true)" onblur="toggleUI(false)">
        <input type="number" class="item-price" placeholder="0" oninput="updateTotal()" onfocus="toggleUI(true)" onblur="toggleUI(false)">
    `;
    list.appendChild(row);
    // Авто-скролл вниз при добавлении новой строки
    list.scrollTop = list.scrollHeight;
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(input => {
        total += Number(input.value) || 0;
    });
    document.getElementById('total-value').innerText = total;
}

function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total > 0) {
        savedRecords.unshift({
            date: new Date().toLocaleDateString(),
            total: total
        });
        localStorage.setItem('money_logs', JSON.stringify(savedRecords));
        // Очистка полей
        document.getElementById('items-list').innerHTML = '';
        document.getElementById('total-value').innerText = '0';
        createNewRow();
        showScreen('screen-home', document.querySelector('.tab-item'), 0);
    }
}

function toggleUI(isFocused) {
    const nav = document.getElementById('bottom-nav');
    if (isFocused) nav.classList.add('ui-hidden');
    else setTimeout(() => nav.classList.remove('ui-hidden'), 100);
}

function handleGlobalClick(e) {
    if (e.target.tagName !== 'INPUT') document.activeElement.blur();
}

// Старт
createNewRow();
renderCards();
