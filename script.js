// Инициализация Telegram Mini App
const tg = window.Telegram.WebApp;
tg.expand(); // Развернуть на весь экран

function showScreen(screenId, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if(el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

// Управление строками
function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="Товар..." class="item-name">
        <input type="number" placeholder="0" class="item-price" oninput="updateTotal()">
    `;
    container.appendChild(div);

    const priceInput = div.querySelector('.item-price');
    priceInput.addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            createNewRow();
            // Фокусируемся на новом поле товара (следующем элементе)
            setTimeout(() => {
                const rows = document.querySelectorAll('.item-name');
                rows[rows.length - 1].focus();
            }, 10);
        }
    });
}

// Создаем первую строку при запуске
createNewRow();

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(input => {
        total += Number(input.value) || 0;
    });
    document.getElementById('total-value').innerText = total;
}

// Сохранение и главный экран
function saveAndHome() {
    const total = document.getElementById('total-value').innerText;
    if (total == 0) return;

    localStorage.setItem('savedSum', total);
    
    const savedView = document.getElementById('saved-data-view');
    document.getElementById('empty-view').classList.add('hidden');
    savedView.classList.remove('hidden');
    
    savedView.innerHTML = `
        <div class="glass" style="padding: 30px; text-align: center; width: 100%;">
            <p style="margin:0; opacity:0.8;">Ваш последний расчет</p>
            <h1 style="font-size: 48px; margin: 10px 0;">${total} ₽</h1>
            <button onclick="clearSave()" style="background:none; border:1px solid white; color:white; border-radius:10px; padding:5px 15px;">Сбросить</button>
        </div>
    `;
    showScreen('screen-home');
}

function clearSave() {
    localStorage.removeItem('savedSum');
    location.reload();
}

// Загрузка ника из Telegram
if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    document.getElementById('user-name').innerText = tg.initDataUnsafe.user.first_name;
}

// Простой конвертер (заглушка)
function convertCurrency() {
    const val = document.getElementById('conv-input').value;
    const res = (val * 0.011).toFixed(2); // Примерный курс
    document.getElementById('conv-result').innerText = `≈ ${res} USD`;
}
