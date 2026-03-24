const tg = window.Telegram.WebApp;
tg.expand();

// 1. ЗАКРЫТИЕ КЛАВИАТУРЫ ПО ТАПУ НА ЭКРАН
document.addEventListener('click', (e) => {
    // Если кликнули не по input, убираем фокус (скрываем клавиатуру)
    if (e.target.tagName !== 'INPUT') {
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
    
    // При переключении на главную — обновляем карточки
    if (id === 'screen-home') renderCards();
}

// УПРАВЛЕНИЕ UI (Клавиатура и отступы)
function toggleUI(isFocused, element = null) {
    const totalBar = document.getElementById('total-bar');
    const bottomNav = document.getElementById('bottom-nav');
    const scrollContainer = document.querySelector('.scroll-container');
    
    if (isFocused) {
        if (totalBar) totalBar.classList.add('v-hide');
        bottomNav.classList.add('v-hide');
        if (scrollContainer) scrollContainer.classList.add('full-height');
        
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

// СОЗДАНИЕ СТРОКИ (Исправлен баг с 5-й строкой)
function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
        <input type="number" inputmode="decimal" placeholder="0" class="item-price" oninput="updateTotal()" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
    `;
    container.appendChild(div);

    // Авто-прокрутка к новой строке (решает проблему доступности 5+ строк)
    setTimeout(() => {
        div.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    const priceInput = div.querySelector('.item-price');
    priceInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
            createNewRow();
            setTimeout(() => {
                const names = document.querySelectorAll('.item-name');
                names[names.length - 1].focus();
            }, 100);
        }
    });
}

function updateTotal() {
    let t = 0;
    document.querySelectorAll('.item-price').forEach(i => t += Number(i.value) || 0);
    document.getElementById('total-value').innerText = t;
}

// СОХРАНЕНИЕ И МОДАЛКА
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total === "0") return;
    document.getElementById('modal-total-value').innerText = total;
    document.getElementById('modal-overlay').classList.remove('hidden');
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
    document.getElementById('modal-overlay').classList.add('hidden');
    clearCounter();
    showScreen('screen-home', document.querySelector('.tab-item'), 0);
}

function cancelSave() {
    document.getElementById('modal-overlay').classList.add('hidden');
    if(confirm("Очистить текущий счетчик?")) {
        clearCounter();
        showScreen('screen-home', document.querySelector('.tab-item'), 0);
    }
}

function clearCounter() {
    document.getElementById('items-list').innerHTML = '';
    document.getElementById('total-value').innerText = '0';
    createNewRow();
}

// ОТРИСОВКА КАРТОЧЕК (Кнопка "добавить" строго по центру)
function renderCards() {
    const container = document.getElementById('cards-container');
    const history = JSON.parse(localStorage.getItem('money_history') || '[]');
    container.innerHTML = '';

    if (history.length === 0) {
        // Если записей нет — показываем огромную кнопку по центру
        container.classList.remove('cards-grid');
        container.innerHTML = `
            <div class="center-content-wrapper">
                <div class="center-content">
                    <button class="add-btn-glass" onclick="showScreen('screen-counter')">
                        <img src="assets/plus.png">
                    </button>
                    <div class="bold-label">добавить</div>
                </div>
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

        // Кнопка "+" в конце списка
        const addBtn = document.createElement('div');
        addBtn.className = 'save-card glass dashed';
        addBtn.innerHTML = '<span style="font-size:40px">+</span>';
        addBtn.onclick = () => { clearCounter(); showScreen('screen-counter'); };
        container.appendChild(addBtn);
    }
}

function deleteCard(event, index) {
    event.stopPropagation();
    if(confirm("Удалить эту запись?")) {
        let history = JSON.parse(localStorage.getItem('money_history') || '[]');
        history.splice(index, 1);
        localStorage.setItem('money_history', JSON.stringify(history));
        renderCards();
    }
}

function loadSavedData(data) {
    document.getElementById('items-list').innerHTML = '';
    data.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'input-row';
        div.innerHTML = `
            <input type="text" value="${item.name}" class="item-name" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
            <input type="number" value="${item.price}" class="item-price" oninput="updateTotal()" onfocus="toggleUI(true, this)" onblur="toggleUI(false)">
        `;
        document.getElementById('items-list').appendChild(div);
    });
    updateTotal();
    showScreen('screen-counter');
}

// КОНВЕРТЕР
async function convertCurrency() {
    const val = document.getElementById('conv-input').value;
    const f = document.getElementById('from-code').innerText;
    const t = document.getElementById('to-code').innerText;
    if(!val) return;
    try {
        const r = await fetch(`https://api.exchangerate-api.com/v4/latest/${f}`);
        const d = await r.json();
        document.getElementById('conv-result').innerText = (val * d.rates[t]).toFixed(2);
    } catch { document.getElementById('conv-result').innerText = "0.00"; }
}

// Инициализация
createNewRow();
renderCards();
if(tg.initDataUnsafe?.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}
