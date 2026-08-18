// --- СОСТОЯНИЕ И СОХРАНЕНИЕ ---
let state = (function() {
  try {
    const raw = localStorage.getItem('ant_house_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error('Ошибка localStorage', e);
    return null;
  }
})();

if (!state) {
  state = {
    queen: { level: 1, maxLevel: 42 },
    barracks: { level: 1, maxLevel: 84 },
    bag: { resources: 0, boosters: 0 },
    ants: { warrior: 1, engineer: 1 },
    events: {
      supplies: { claimed: false, reward: '500 ресурсов', conditions: 'Провести 3 боя' },
      'power-contest': { claimed: false, reward: '+10% к мощи на 24ч', conditions: 'Войти в топ-50 альянса' },
      'weekly-gift': { claimed: false, reward: '1 ускоритель', conditions: 'Ежедневный вход 7 дней' },
      'daily-gift': { claimed: false, reward: '200 алмазов', conditions: 'Заход в игру' },
      'power-race': { claimed: false, reward: 'Бонус к прокачке +5%', conditions: 'Собрать 1000 ресурсов' }
    },
    theme: 'light' // 'light' | 'dark'
  };
}

function saveState() {
  localStorage.setItem('ant_house_state', JSON.stringify(state));
}

// --- РАСЧЁТ МОЩИ (УРОВЕНЬ + 50%) ---
function calcPower(level) {
  return level + (level * 0.5);
}

// --- ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ---
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  const body = document.body;
  if (state.theme === 'dark') {
    body.setAttribute('data-theme', 'dark');
  } else {
    body.removeAttribute('data-theme');
  }
  saveState();
}
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// --- ОТРИСОВКА ОСНОВНЫХ ЗНАЧЕНИЙ ---
function render() {
  const qLvl = state.queen.level;
  const bLvl = state.barracks.level;

  document.getElementById('queen-level').innerText = `Ур. ${qLvl}`;
  document.getElementById('queen-power').innerText = calcPower(qLvl).toFixed(1);

  document.getElementById('barracks-level').innerText = `Ур. ${bLvl}`;
  document.getElementById('barracks-power').innerText = calcPower(bLvl).toFixed(1);

  document.getElementById('bag-resources').innerText = state.bag.resources;
  document.getElementById('bag-boosters').innerText = state.bag.boosters;
}

// --- ДИАЛОГ ЗДАНИЯ ---
let currentBuilding = null;

function openBuildingDialog(building) {
  currentBuilding = building;
  const overlay = document.getElementById('dialog-overlay');
  overlay.style.display = 'flex';

  const title = document.getElementById('dialog-title');
  const info = document.getElementById('dialog-info');
  const power = document.getElementById('dialog-power');
  const btnImprove = document.getElementById('dialog-btn-improve');
  const btnTrain = document.getElementById('dialog-btn-train');

  if (building === 'queen') {
    title.innerText = '👑 Королева';
    info.innerText = 'Улучшение Королевы увеличивает общую мощь армии. Максимальный уровень: 42.';
    power.innerText = `Мощь: ${calcPower(state.queen.level).toFixed(1)}`;
    btnImprove.innerText = 'Улучшить Королеву';
    btnTrain.style.display = 'none';
  } else if (building === 'barracks') {
    title.innerText = '🛡 Казармы';
    info.innerText = 'Здесь обучают новых солдат. Обучение добавляет мощь армии. Максимальный уровень: 84.';
    power.innerText = `Мощь: ${calcPower(state.barracks.level).toFixed(1)}`;
    btnImprove.innerText = 'Улучшить Казармы';
    btnTrain.style.display = 'inline-block';
  }
}

function closeDialog() {
  document.getElementById('dialog-overlay').style.display = 'none';
}

document.getElementById('dialog-btn-improve').addEventListener('click', () => {
  if (!currentBuilding) return;
  if (currentBuilding === 'queen') {
    if (state.queen.level >= state.queen.maxLevel) {
      alert('Королева уже на максимальном уровне!');
      return;
    }
    state.queen.level++;
  } else if (currentBuilding === 'barracks') {
    if (state.barracks.level >= state.barracks.maxLevel) {
      alert('Казармы уже на максимальном уровне!');
      return;
    }
    state.barracks.level++;
  }
  saveState();
  render();
  closeDialog();
});

document.getElementById('dialog-btn-train').addEventListener('click', () => {
  if (currentBuilding !== 'barracks') return;
  // При обучении: мощь += уровень (здесь условно добавляем в сумку как ресурс/бонус)
  const bonusPower = state.barracks.level;
  state.bag.resources += 100; // пример награды
  alert(`Обучение завершено! Получено +${bonusPower} к мощи и 100 ресурсов.`);
  saveState();
  render();
  closeDialog();
});

// --- ОТКРЫТИЕ СОБЫТИЯ (МОДАЛКА) ---
function openEvent(eventKey) {
  const data = state.events[eventKey];
  if (!data) return;

  const modal = document.getElementById('event-modal-overlay');
  modal.style.display = 'flex';

  document.getElementById('event-modal-title').innerText = getEventTitle(eventKey);
  document.getElementById('event-modal-desc').innerText = data.conditions;
  document.getElementById('event-modal-reward').innerText = data.reward;
  document.getElementById('event-modal-conditions').innerText = data.conditions;

  const claimBtn = document.querySelector('#event-modal-overlay .btn-green');
  claimBtn.style.display = data.claimed ? 'none' : 'inline-block';
}

function getEventTitle(key) {
  const titles = {
    supplies: '🚚 Сопровождение припасов',
    'power-contest': '⚔️ Состязание мощь',
    'weekly-gift': '🎁 Подарки недели',
    'daily-gift': '🎒 Подарок за заход',
    'power-race': '⚡ Мощь гонка'
  };
  return titles[key] || 'Событие';
}

function closeEventModal() {
  document.getElementById('event-modal-overlay').style.display = 'none';
}

function claimEventReward() {
  // Здесь можно добавить логику проверки условий
  const eventKey = getActiveEventKey(); // упрощённо: берём из последнего открытого
  if (!eventKey || state.events[eventKey].claimed) return;

  state.events[eventKey].claimed = true;
  
  // Награда
  if (eventKey === 'daily-gift') {
    state.bag.resources += 200;
  } else if (eventKey === 'weekly-gift') {
    state.bag.boosters += 1;
  } else if (eventKey === 'supplies') {
    state.bag.resources += 500;
  } else if (eventKey === 'power-contest') {
    // бонус к мощи: условно +10% на время — здесь просто добавляем в ресурсы для теста
    state.bag.resources += 300;
  } else if (eventKey === 'power-race') {
    state.bag.boosters += 1;
  }

  alert('Награда получена!');
  saveState();
  render();
  closeEventModal();
}

// Вспомогательная функция: чтобы понять, какое событие открыто (упрощено)
function getActiveEventKey() {
  // В реальном коде можно хранить ключ в data-атрибуте модалки
  // Для простоты — пока не используется, логика выше берёт данные из state по ключу
  return null; 
}

// --- УЛУЧШЕНИЕ МУРАВЬЁВ ---
function upgradeAnt(antType) {
  state.ants[antType]++;
  const cost = 100 * state.ants[antType]; // примерная стоимость
  if (state.bag.resources >= cost) {
    state.bag.resources -= cost;
    alert(`Муравей ${antType} улучшен!`);
  } else {
    alert('Не хватает ресурсов в сумке.');
  }
  saveState();
  render();
}

// --- ИНИЦИАЛИЗАЦИЯ ---
render();

// Применение темы при загрузке
if (state.theme === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
}
