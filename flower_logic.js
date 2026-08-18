// --- КОНФИГУРАЦИЯ ЦВЕТОВ (НАЗВАНИЯ ПО УРОВНЯМ) ---
const flowerNames = [
  'Ромашка', 'Василёк', 'Лютик', 'Одуванчик', 'Клевер',
  'Картошка', 'Подсолнух', 'Гвоздика', 'Пион', 'Тюльпан',
  'Нарцисс', 'Ирис', 'Герань', 'Бегония', 'Фиалка',
  'Орхидея', 'Лилия', 'Роза', 'Хризантема', 'Камелия',
  'Азалия', 'Гортензия', 'Эустома', 'Анемона', 'Фрезия',
  'Катарантус', 'Примула', 'Цикламен', 'Крокус', 'Гиацинт'
];

function getFlowerNameByLevel(level) {
  const idx = (level - 1) % flowerNames.length;
  return flowerNames[idx] || `Цветок ${level}`;
}

// --- ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ (если нет) ---
if (!state.flowerAlley) {
  state.flowerAlley = {
    beds: [],
    seeds: 0,
    flowers: 0,
    chips: 0,
    diamonds: 0
  };
  // Создаём 12 грядок для наглядности
  for (let i = 0; i < 12; i++) {
    state.flowerAlley.beds.push({
      id: i + 1,
      level: 1,
      progress: 0,
      ready: false,
      name: getFlowerNameByLevel(1),
      cd: 10000 // 10 секунд для теста (потом можно поставить 60000)
    });
  }
  saveState();
}

// --- ЦЕНЫ ---
function getSeedPrice(level) { return level * 5; }
function getFlowerPrice(level) { return getSeedPrice(level) * 2; }
const chipPrice = 70;

// --- ПРОИЗВОДСТВО И СБОР ---
function startProduction(bedId) {
  const bed = state.flowerAlley.beds.find(b => b.id === bedId);
  if (!bed || bed.ready || bed.progress > 0) return;
  
  bed.progress = 0;
  saveState();
  renderFlowerAlley();

  const interval = setInterval(() => {
    bed.progress += 1000;
    if (bed.progress >= bed.cd) {
      bed.progress = bed.cd;
      bed.ready = true;
      clearInterval(interval);
      saveState();
      renderFlowerAlley();
    }
  }, 1000);
}

function harvest(bedId) {
  const bed = state.flowerAlley.beds.find(b => b.id === bedId);
  if (!bed || !bed.ready) return;

  state.flowerAlley.flowers++;
  bed.ready = false;
  bed.progress = 0;
  saveState();
  renderFlowerAlley();
}

function makeChips() {
  const costFlowers = 5;
  if (state.flowerAlley.flowers >= costFlowers) {
    state.flowerAlley.flowers -= costFlowers;
    state.flowerAlley.chips++;
    saveState();
    renderFlowerAlley();
  } else {
    alert('Не хватает цветков! Нужно 5 цветков для 1 чипса.');
  }
}

// --- ТОРГОВЛЯ ---
function openTradeDialog(mode) {
  const overlay = document.getElementById('trade-overlay');
  const title = document.querySelector('#trade-overlay .trade-mode-title');
  const container = document.getElementById('trade-buttons');
  
  if (!overlay || !title || !container) return;

  overlay.style.display = 'flex';
  title.innerText = mode === 'buy' ? '🌾 Покупка семян' : '💰 Продажа товаров';
  container.innerHTML = '';

  const maxButtons = 100; // 100 кнопок в одном окне

  for (let i = 1; i <= maxButtons; i++) {
    const btn = document.createElement('button');
    btn.className = 'trade-btn';
    
    if (mode === 'buy') {
      const price = getSeedPrice(i);
      btn.innerText = `Ур.${i}\n${price} рес.`;
      btn.classList.add('btn-buy');
      btn.onclick = () => buySeeds(i, price);
    } else {
      // Продажа: 1-50 цветки, 51-100 чипсы
      if (i <= 50) {
        const price = getFlowerPrice(i);
        btn.innerText = `Цв. ур.${i}\n${price} алм.`;
        btn.classList.add('btn-sell-flower');
        btn.onclick = () => sellFlowers(i, price);
      } else {
        btn.innerText = `Чипсы\n${chipPrice} алм.`;
        btn.classList.add('btn-sell-chip');
        btn.onclick = () => sellChips(chipPrice);
      }
    }
    container.appendChild(btn);
  }
}

function closeTradeDialog() {
  const overlay = document.getElementById('trade-overlay');
  if (overlay) overlay.style.display = 'none';
}

function buySeeds(level, price) {
  if (state.bag.resources >= price) {
    state.bag.resources -= price;
    state.flowerAlley.seeds++;
    saveState();
    renderFlowerAlley();
    // Визуальный фидбек
    const el = document.getElementById('bag-resources');
    if(el) el.style.color = '#2ecc71';
    setTimeout(() => el.style.color = '', 500);
  } else {
    alert('Недостаточно ресурсов в сумке!');
  }
}

function sellFlowers(level, price) {
  if (state.flowerAlley.flowers > 0) {
    state.flowerAlley.flowers--;
    state.flowerAlley.diamonds += price;
    saveState();
    renderFlowerAlley();
  } else {
    alert('Нет собранных цветков для продажи!');
  }
}

function sellChips(price) {
  if (state.flowerAlley.chips > 0) {
    state.flowerAlley.chips--;
    state.flowerAlley.diamonds += price;
    saveState();
    renderFlowerAlley();
  } else {
    alert('Нет чипсов для продажи!');
  }
}

// --- ОТРИСОВКА ---
function renderFlowerAlley() {
  const el = document.getElementById('flower-alley-container');
  if (!el) return;

  el.innerHTML = `
    <div class="stats-row">
      <div class="stat-item">🌾 Семена: ${state.flowerAlley.seeds}</div>
      <div class="stat-item">🌸 Цветки: ${state.flowerAlley.flowers}</div>
      <div class="stat-item">🍟 Чипсы: ${state.flowerAlley.chips}</div>
      <div class="stat-item diamond-stat">💎 Алмазы: ${state.flowerAlley.diamonds}</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-top:12px;">
      ${state.flowerAlley.beds.map(bed => {
        const percent = Math.min(100, (bed.progress / bed.cd) * 100);
        const isGrowing = !bed.ready && bed.progress < bed.cd;
        
        return `
          <div class="flower-bed-card">
            <span class="flower-name-level">${bed.name} (ур.${bed.level})</span>
            <div class="flower-status ${isGrowing ? 'status-growing' : 'status-ready'}">
              ${bed.ready ? 'Готов к сбору' : `Рост: ${Math.floor(percent)}%`}
            </div>
            
            <div class="bed-actions">
              ${!isGrowing && !bed.ready ? `
                <button class="btn-green" onclick="startProduction(${bed.id})">Начать рост</button>
              ` : ''}
              ${bed.ready ? `
                <button class="btn-accent" onclick="harvest(${bed.id})">Собрать цветок</button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn-green" onclick="makeChips()">🍟 Произвести чипсы (5 цв. → 1 шт.)</button>
      <button class="btn-accent" onclick="openTradeDialog('buy')">🛒 Купить семена</button>
      <button class="btn-green" onclick="openTradeDialog('sell')">💸 Продать товары</button>
    </div>
  `;
}

// --- ВСТАВКА МОДАЛКИ (если её нет в HTML) ---
function injectTradeModal() {
  if (document.getElementById('trade-overlay')) return;
  const body = document.body;
  const modal = document.createElement('div');
  modal.id = 'trade-overlay';
  modal.innerHTML = `
    <div class="trade-dialog">
      <h3 class="trade-mode-title" id="trade-modal-title">Торговля</h3>
      <div id="trade-buttons" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; max-height: 60vh; overflow-y: auto; padding: 4px;"></div>
      <hr style="border: 0; border-top: 1px dashed var(--border); margin: 16px 0;">
      <button class="btn-red" style="width: 100%;" onclick="closeTradeDialog()">Закрыть</button>
    </div>
  `;
  body.appendChild(modal);
}
injectTradeModal();

// --- ЗАПУСК ---
renderFlowerAlley();
