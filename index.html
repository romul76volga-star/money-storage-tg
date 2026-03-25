<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>MoneyStorage Pro</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body onclick="handleGlobalClick(event)" class="theme-green">
    <header class="app-header">
        <div class="header-content">
            <span id="screen-title">Главная</span>
            <div id="header-action" class="header-check-btn hidden" onclick="saveAndHome()">
                <span>✓</span>
            </div>
        </div>
    </header>

    <main id="app-content">
        <section id="screen-home" class="screen active">
            <div id="cards-container" class="scrollable-content cards-grid"></div>
        </section>

        <section id="screen-counter" class="screen">
            <div id="items-list" class="scrollable-content"></div>
            <div id="counter-controls" class="bottom-controls hide-on-kb">
                <div class="add-box-border" onclick="createNewRow()">
                    <span>+</span>
                </div>
                <div id="total-bar" class="total-plate">
                    <div class="total-label">ОБЩАЯ СУММА ЗАТРАТ</div>
                    <div class="total-sum"><span id="total-value">0</span> ₽</div>
                </div>
            </div>
        </section>

        <section id="screen-converter" class="screen">
            <div class="scrollable-content converter-page">
                <div class="converter-main-card">
                    <div class="conv-row-simple">
                        <select id="from-currency" class="currency-select" onchange="convertCurrency()">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="RUB" selected>RUB</option>
                            <option value="BYN">BYN</option>
                            <option value="KZT">KZT</option>
                        </select>
                        <input type="number" id="from-amount" class="conv-input" value="100" oninput="convertCurrency()">
                    </div>

                    <div class="swap-container">
                        <div class="conv-divider" onclick="swapCurrencies()">⇅</div>
                    </div>

                    <div class="conv-row-simple">
                        <select id="to-currency" class="currency-select" onchange="convertCurrency()">
                            <option value="USD" selected>USD</option>
                            <option value="EUR">EUR</option>
                            <option value="RUB">RUB</option>
                            <option value="BYN">BYN</option>
                            <option value="KZT">KZT</option>
                        </select>
                        <input type="number" id="to-amount" class="conv-input result-input" readonly>
                    </div>
                </div>

                <div class="rate-info-card">
                    <div class="rate-text"><span id="current-rate-display">загрузка...</span></div>
                    <div class="rate-update-time" id="rate-update-time"></div>
                    <button class="update-rates-btn" onclick="fetchRates()">Обновить курс</button>
                </div>
            </div>
        </section>

        <section id="screen-settings" class="screen">
            <div class="scrollable-content profile-page">
                <div class="profile-card">
                    <div class="avatar-container"><img id="user-photo" src="" alt=""></div>
                    <h2 id="user-name" class="profile-nickname">...</h2>
                </div>
                <div class="theme-grid">
                    <div class="theme-item" onclick="setTheme('theme-black')"><div class="theme-circle t-black"></div></div>
                    <div class="theme-item" onclick="setTheme('theme-white')"><div class="theme-circle t-white"></div></div>
                    <div class="theme-item" onclick="setTheme('theme-green')"><div class="theme-circle t-green"></div></div>
                </div>
                <button class="action-btn" onclick="clearData()" style="width:100%">Очистить данные</button>
            </div>
        </section>
    </main>

    <nav id="bottom-nav" class="tab-bar hide-on-kb">
        <div id="tab-indicator"></div>
        <div class="tab-item active" onclick="showScreen('screen-home', this, 0)"><img src="assets/home.png"></div>
        <div class="tab-item" onclick="showScreen('screen-converter', this, 1)"><img src="assets/dollar.png"></div>
        <div class="tab-item" onclick="showScreen('screen-settings', this, 2)"><img src="assets/gear.png"></div>
    </nav>
    <script src="script.js"></script>
</body>
</html>
