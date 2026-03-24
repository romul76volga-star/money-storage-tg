const tg = window.Telegram.WebApp;
tg.expand();

function showScreen(id, el, idx) {
    // 1. Скрываем все экраны
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // 2. Показываем нужный
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    // Обновляем заголовок
    const titles = { 'screen-home': 'Главная', 'screen-counter': 'Счетчик', 'screen-converter': 'Валюта', 'screen-settings': 'Настройки' };
    document.getElementById('header-title').innerText = titles[id] || 'App';
    
    // Кнопка сохранения только в счетчике
    document.getElementById('header-save').classList.toggle('hidden', id !== 'screen-counter');

    // Активная иконка
    if(el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

function renderCards() {
    const container = document.getElementById('cards-container');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        // Если пусто - создаем обертку для центра
        container.style.display = 'block'; 
        container.innerHTML = `
            <div class="empty-wrapper">
                <button class="add-btn-round" onclick="showScreen('screen-counter')">+</button>
                <div style="font-weight: bold">добавить</div>
            </div>`;
    } else {
        container.style.display = 'grid';
        // Кнопка "+" в сетке
        const addBtn = document.createElement('div');
        addBtn.className = 'save-card glass';
        addBtn.style.border = '2px dashed white';
        addBtn.style.alignItems = 'center';
        addBtn.style.justifyContent = 'center';
        addBtn.innerHTML = '<span style="font-size: 30px">+</span>';
        addBtn.onclick = () => showScreen('screen-counter');
        container.appendChild(addBtn);

        // Карточки из базы
        [...history].reverse().forEach(item => {
            const card = document.createElement('div');
            card.className = 'save-card';
            card.innerHTML = `
                <div style="font-size: 12px; opacity: 0.7">${item.date}</div>
                <div style="font-size: 22px; font-weight: bold">${item.total}</div>
            `;
            container.appendChild(card);
        });
    }
}

// Логика счетчика (строки)
function addRow() {
    const list = document.getElementById('items-list');
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" class="item-name" placeholder="Товар">
        <input type="number" class="item-price" placeholder="0" oninput="calcTotal()">
    `;
    list.appendChild(row);
}

function calcTotal() {
    let sum = 0;
    document.querySelectorAll('.item-price').forEach(p => sum += Number(p.value) || 0);
    document.getElementById('total-value').innerText = sum;
}

// Сохранение
function saveAndHome() {
    const val = document.getElementById('total-value').innerText;
    if(val == "0") return;
    document.getElementById('modal-total-value').innerText = val;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }

function confirmSave() {
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    history.push({
        date: new Date().toLocaleDateString('ru-RU'),
        total: document.getElementById('total-value').innerText
    });
    localStorage.setItem('money_history', JSON.stringify(history));
    
    // Сброс и возврат
    document.getElementById('items-list').innerHTML = '';
    addRow();
    calcTotal();
    renderCards();
    closeModal();
    showScreen('screen-home', document.querySelectorAll('.tab-item')[0], 0);
}

function clearData() {
    localStorage.clear();
    location.reload();
}

// Старт
addRow();
renderCards();
