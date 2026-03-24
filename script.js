function showScreen(screenId, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    if(el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
}

// Добавление новой строки
function createNewRow() {
    const container = document.getElementById('items-list');
    const div = document.createElement('div');
    div.className = 'input-row';
    div.innerHTML = `
        <input type="text" placeholder="товар..." class="item-name">
        <input type="number" placeholder="цена" class="item-price" oninput="updateTotal()">
    `;
    container.appendChild(div);

    const inputs = div.querySelectorAll('input');
    inputs[1].addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            createNewRow();
            container.scrollTo(0, container.scrollHeight);
        }
    });
}

// Первая строка при загрузке
createNewRow();

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-price').forEach(input => {
        total += Number(input.value) || 0;
    });
    document.getElementById('total-value').innerText = total;
}

// Конвертер (заглушка с реальной логикой)
async function convertCurrency() {
    const amount = document.getElementById('conv-input').value;
    // В реальности тут будет fetch к API курсов
    const rate = 0.011; // Пример: RUB в USD
    document.getElementById('conv-result').innerText = (amount * rate).toFixed(2) + " USD";
}

function saveAndHome() {
    // Логика сохранения (сохраняем в localStorage)
    const total = document.getElementById('total-value').innerText;
    localStorage.setItem('lastTotal', total);
    
    // Показываем на главном экране
    document.getElementById('empty-view').classList.add('hidden');
    document.getElementById('saved-data-view').classList.remove('hidden');
    document.getElementById('saved-data-view').innerHTML = `
        <div class="glass" style="padding:20px; text-align:center;">
            <h3>Последний расход</h3>
            <h1>${total} ₽</h1>
        </div>
    `;
    showScreen('screen-home');
}
