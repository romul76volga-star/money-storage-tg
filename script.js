const tg = window.Telegram.WebApp;
tg.expand();

let savedRecords = JSON.parse(localStorage.getItem('money_logs') || '[]');

function showScreen(id, el, idx) {
    // 1. Скрываем все экраны
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // 2. Показываем нужный
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    
    // 3. Заголовок и галочка
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Конвертер', 'screen-settings': 'Профиль' };
    document.getElementById('screen-title').innerText = titles[id] || '';
    document.getElementById('header-action').classList.toggle('hidden', id !== 'screen-counter');

    // 4. Индикатор меню
    if (idx !== undefined) {
        const positions = ['16.5%', '50%', '83.5%'];
        const indicator = document.getElementById('tab-indicator');
        indicator.style.left = positions[idx];
        indicator.style.transform = 'translateX(-50%)';
    }

    // 5. Активная иконка
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
        // ВИД 1: Круглая кнопка
        container.innerHTML = `
            <div class="first-add-wrapper" onclick="showScreen('screen-counter', null, 1)">
                <div class="big-circle-btn">+</div>
                <div style="font-weight:bold;">добавить</div>
            </div>`;
    } else {
        // ВИД 2: Файлы + кнопка-рамка
        savedRecords.forEach((rec, index) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.innerHTML = `
                <div class="card-date">${rec.date}</div>
                <div class="card-sum">${rec.total} RUB</div>
                <button class="del-btn" onclick="deleteCard(${index}, event)">✕</button>
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

function deleteCard(index, event) {
    event.stopPropagation();
    if (confirm("Удалить этот файл?")) {
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
        document.getElementById('items-list').innerHTML = '';
        document.getElementById('total-value').innerText = '0';
        createNewRow();
        showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
    }
}

function toggleUI(isFocused) {
    const nav = document.getElementById('bottom-nav');
    if (isFocused) nav.classList.add('ui-hidden');
    else setTimeout(() => nav.classList.remove('ui-hidden'), 100);
}

function clearData() {
    if(confirm("Очистить все записи?")) {
        localStorage.clear();
        location.reload();
    }
}

function handleGlobalClick(e) {
    if (e.target.tagName !== 'INPUT') document.activeElement.blur();
}

// Инициализация
createNewRow();
renderCards();
