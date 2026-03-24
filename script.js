const tg = window.Telegram.WebApp;
tg.expand();

// 1. ЗАКРЫТИЕ КЛАВИАТУРЫ
document.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !e.target.closest('.add-row-bar')) {
        document.activeElement.blur();
    }
});

// НАВИГАЦИЯ
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
        const pos = ['7.5%', '41%', '74.5%'];
        document.getElementById('tab-indicator').style.left = pos[idx];
    }
    
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
    
    if (id === 'screen-home') renderCards();
}

// УПРАВЛЕНИЕ UI (Скрытие навигации при вводе)
function toggleUI(isFocused, element = null) {
    const bottomNav = document.getElementById('bottom-nav');
    const totalBar = document.getElementById('total-bar');
    
    if (isFocused) {
        bottomNav.classList.add('v-hide');
        if (totalBar) totalBar.classList.add('on-keyboard');
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    } else {
        setTimeout(() => {
            if (document.activeElement.tagName !== 'INPUT') {
                bottomNav.classList.remove('v-hide');
                if (totalBar) totalBar.classList.remove('on-keyboard');
            }
        }, 150);
    }
}

// ЛОГИКА СЧЕТЧИКА
function createNewRow(name = '', price = '') {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" value="${name}" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
        <input type="number" inputmode="decimal" placeholder="0" class="item-price" value="${price}" oninput="updateTotal()" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
    `;
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

// СОХРАНЕНИЕ (Модальное окно на весь экран)
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total === "0") return;
    document.getElementById('modal-total-value').innerText = total;
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('hidden');
    modal.style.display = 'flex'; // Гарантируем центрирование
}

function closeSaveModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.add('hidden');
    modal.style.display = 'none';
}

function confirmSave() {
    const total = document.getElementById('total-value').innerText;
    const items = [];
    document.querySelectorAll('.input-row').forEach(row => {
        const name = row.querySelector('.item-name').value;
        const price = row.querySelector('.item-price').value;
        if (name || price) items.push({ name, price });
    });

    const saveData = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ru-RU'),
        total: total,
        items: items
    };

    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    history.push(saveData);
    localStorage.setItem('money_history', JSON.stringify(history));

    tg.HapticFeedback.notificationOccurred('success');
    closeSaveModal();
    clearCounter();
    showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
}

function clearCounter() {
    document.getElementById('items-list').innerHTML = '';
    document.getElementById('total-value').innerText = '0';
    createNewRow();
}

// ОТРИСОВКА ИСТОРИИ (ГЛАВНАЯ)
function renderCards() {
    const container = document.getElementById('cards-container');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        container.classList.remove('cards-grid');
        container.innerHTML = `
            <div class="center-content">
                <button class="add-btn-glass" onclick="showScreen('screen-counter')"><img src="assets/plus.png"></button>
                <div class="bold-label">добавить</div>
            </div>`;
    } else {
        container.classList.add('cards-grid');
        [...history].reverse().forEach((data, index) => {
            const card = document.createElement('div');
            card.className = 'save-card';
            card.onclick = () => loadSavedData(data);
            card.innerHTML = `
                <button class="delete-btn" onclick="deleteCard(event, ${history.length - 1 - index})">✕</button>
                <div class="card-date">${data.date}</div>
                <div class="card-amount">${data.total}</div>
            `;
            container.appendChild(card);
        });

        const addCard = document.createElement('div');
        addCard.className = 'save-card dashed';
        addCard.innerHTML = '<span>+</span>';
        addCard.onclick = () => { clearCounter(); showScreen('screen-counter'); };
        container.appendChild(addCard);
    }
}

function deleteCard(event, index) {
    event.stopPropagation();
    if(confirm("Удалить запись?")) {
        let history = JSON.parse(localStorage.getItem('money_history') || '[]');
        history.splice(index, 1);
        localStorage.setItem('money_history', JSON.stringify(history));
        renderCards();
    }
}

function loadSavedData(data) {
    document.getElementById('items-list').innerHTML = '';
    data.items.forEach(item => createNewRow(item.name, item.price));
    updateTotal();
    showScreen('screen-counter');
}

// ИНИЦИАЛИЗАЦИЯ
createNewRow();
renderCards();
if(tg.initDataUnsafe?.user) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) userNameElement.innerText = tg.initDataUnsafe.user.first_name;
}
