    // Загрузка состояния из localStorage
    let state = JSON.parse(localStorage.getItem('ant_state')) || {
      currentAlly: 'none',
      contribution: 0,
      log: [],
      unlockedTechs: [] // массив ID открытых технологий
    };

    const el = (id) => document.getElementById(id);

    function saveState() {
      localStorage.setItem('ant_state', JSON.stringify(state));
    }

    function addLog(msg) {
      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      state.log.push(`[${time}] ${msg}`);
      if (state.log.length > 10) state.log.shift();
      const area = el('log-area');
      if (!area) return;
      area.innerHTML = state.log.map(l => `<div class="log-line">${l}</div>`).join('');
      area.scrollTop = area.scrollHeight;
    }

    // Ранги по вкладу
    function getRank(contribution) {
      if (contribution >= 80) return { name: 'Ветеран', color: '#ff6b81' };
      if (contribution >= 50) return { name: 'Профи', color: '#4facf9' };
      if (contribution >= 20) return { name: 'Боец', color: '#fdcb6e' };
      return { name: 'Новичок', color: '#aaa' };
    }

    // Мощь альянса
    function getAllyPower(ally) {
      const powers = {
        'none': 0,
        'TWA': 3800000000,
        'MUR': 2100000000,
        'MIR': 2500000000,
        'SPA': 3100000000
      };
      return (powers[ally] || 0) / 1e9;
    }

    // Дерево технологий
    const techs = [
      { id: 'tech_farm_boost', name: 'Усиление фермы', desc: '+15% к сбору ресурсов на ферме.', cost: 10, minRank: 0, bonus: '+15% сбор' },
      { id: 'tech_shield_dur', name: 'Прочность щита', desc: '+12 часов к длительности щита.', cost: 20, minRank: 1, bonus: '+12ч щит' },
      { id: 'tech_army_bonus', name: 'Бонус армии', desc: '+8% к общей мощи армии альянса.', cost: 30, minRank: 1, bonus: '+8% мощь' },
      { id: 'tech_scout_range', name: 'Дальность разведки', desc: 'Увеличивает радиус обнаружения ресурсов у противников.', cost: 40, minRank: 2, bonus: 'дальность +' },
      { id: 'tech_stealth_grab', name: 'Тихий захват', desc: 'Позволяет забирать ресурсы у противников без активных боёв (твоя тактика).', cost: 50, minRank: 2, bonus: 'тихий захват' },
      { id: 'tech_ally_storage', name: 'Склад альянса', desc: 'Общий склад для обмена ресурсами между участниками.', cost: 60, minRank: 3, bonus: 'общий склад' },
      { id: 'tech_elite_troops', name: 'Элитные войска', desc: '+12% к атаке и защите армии (для ветеранов).', cost: 80, minRank: 3, bonus: '+12% атака/защита' }
    ];

    // Перевод ранга в число (Новичок=0, Боец=1, Профи=2, Ветеран=3)
    function rankToNum(name) {
      if (name === 'Ветеран') return 3;
      if (name === 'Профи') return 2;
      if (name === 'Боец') return 1;
      return 0;
    }

    function renderTechs() {
      const grid = el('tech-grid');
      const r = getRank(state.contribution);
      const currentRankNum = rankToNum(r.name);

      grid.innerHTML = '';
      techs.forEach(t => {
        const isUnlocked = state.unlockedTechs.includes(t.id);
        const canUnlock = !isUnlocked && state.contribution >= t.cost && currentRankNum >= t.minRank;

        const card = document.createElement('div');
        card.className = `tech-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        if (!canUnlock && !isUnlocked) card.classList.add('locked');

        card.innerHTML = `
          <div class="tech-title">${t.name}</div>
          <div class="tech-desc">${t.desc}</div>
          ${!isUnlocked ? `<div class="tech-cost">Требуется: ${t.cost}% вклада, ранг ≥ ${['Новичок','Боец','Профи','Ветеран'][t.minRank]}</div>` : `<div class="tech-cost" style="color:var(--success)">Открыто</div>`}
          <div class="tech-status">
            ${isUnlocked ? '<span class="status-unlocked">✅ Активно</span>' : '<span class="status-locked">❌ Закрыто</span>'}
          </div>
        `;

        if (canUnlock) {
          card.onclick = () => unlockTech(t);
        } else if (!isUnlocked) {
          card.style.cursor = 'not-allowed';
        }

        grid.appendChild(card);
      });
    }

    function unlockTech(tech) {
      if (state.unlockedTechs.includes(tech.id)) return;

      const r = getRank(state.contribution);
      const currentRankNum = rankToNum(r.name);
      if (state.contribution < tech.cost || currentRankNum < tech.minRank) {
        addLog('❌ Не хватает вклада или ранга для этой технологии.');
        return;
      }

      state.unlockedTechs.push(tech.id);
      addLog(`✅ Разблокирована технология: ${tech.name} (${tech.bonus})`);
      saveState();
      renderTechs();
    }

    function updateUI() {
      el('ally-contribution').textContent = state.contribution + '%';
      const r = getRank(state.contribution);
      const rankEl = el('player-rank');
      rankEl.textContent = r.name;
      rankEl.style.color = r.color;

      el('ally-power').textContent = getAllyPower(state.currentAlly).toFixed(1) + 'B';
      renderTechs();
      // Обновляем логи при перезагрузке
      const area = el('log-area');
      if (area) {
        area.innerHTML = state.log.map(l => `<div class="log-line">${l}</div>`).join('');
        area.scrollTop = area.scrollHeight;
      }
    }
	updateUI();