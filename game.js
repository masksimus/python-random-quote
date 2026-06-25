(() => {
  'use strict';

  const SAVE_KEY = 'vk_cosmo_clicker_save_v1';
  const ROUND_SECONDS = 60;
  const $ = (id) => document.getElementById(id);
  const els = {
    coins: $('coins'), gems: $('gems'), playerRank: $('playerRank'), levelText: $('levelText'), powerText: $('powerText'), xpBar: $('xpBar'),
    roundText: $('roundText'), timerText: $('timerText'), coreButton: $('coreButton'), gainText: $('gainText'), goalText: $('goalText'), goalBar: $('goalBar'),
    comboText: $('comboText'), tapUpgradeBtn: $('tapUpgradeBtn'), idleUpgradeBtn: $('idleUpgradeBtn'), tapUpgradeText: $('tapUpgradeText'), idleUpgradeText: $('idleUpgradeText'),
    boostBtn: $('boostBtn'), bonusBtn: $('bonusBtn'), shareBtn: $('shareBtn'), soundBtn: $('soundBtn'), toast: $('toast'), dailyModal: $('dailyModal'), dailyText: $('dailyText'), claimDailyBtn: $('claimDailyBtn'),
    gameOverModal: $('gameOverModal'), resultEmoji: $('resultEmoji'), resultTitle: $('resultTitle'), resultText: $('resultText'), earnedText: $('earnedText'), xpEarnedText: $('xpEarnedText'), reviveBtn: $('reviveBtn'), doubleBtn: $('doubleBtn'), restartBtn: $('restartBtn'), canvas: $('fxCanvas')
  };

  const defaultState = () => ({ coins: 0, gems: 3, xp: 0, level: 1, round: 1, tap: 1, idle: 0, tapLvl: 1, idleLvl: 0, streak: 0, lastDaily: '', roundsPlayed: 0, sound: true, bestRound: 1 });
  let state = { ...defaultState(), ...loadLocal() };
  let round = { active: true, time: ROUND_SECONDS, score: 0, goal: goalFor(state.round), earned: 0, xp: 0, revived: false };
  let combo = 1, lastTap = 0, doubleNext = false, loopId, audio;
  const ctx = els.canvas.getContext('2d');
  const particles = [];

  function initVK() {
    if (!window.vkBridge) return;
    window.vkBridge.send('VKWebAppInit').catch(() => {});
    window.vkBridge.send('VKWebAppStorageGet', { keys: [SAVE_KEY] }).then((r) => {
      const item = r.keys?.find((x) => x.key === SAVE_KEY && x.value);
      if (item) { state = { ...state, ...JSON.parse(item.value) }; startRound(false); render(); }
    }).catch(() => {});
  }

  function loadLocal() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; } }
  function save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if (window.vkBridge) window.vkBridge.send('VKWebAppStorageSet', { key: SAVE_KEY, value: JSON.stringify(state) }).catch(() => {});
  }
  function goalFor(n) { return Math.floor(85 * Math.pow(1.24, n - 1)); }
  function tapCost() { return Math.floor(25 * Math.pow(1.42, state.tapLvl - 1)); }
  function idleCost() { return Math.floor(60 * Math.pow(1.55, state.idleLvl)); }
  function rank() { return state.level >= 25 ? 'Легенда VK' : state.level >= 15 ? 'Галактический магнат' : state.level >= 8 ? 'Капитан кликов' : 'Новичок VK'; }
  function xpNeed() { return 80 + state.level * 35; }

  function startRound(resetTime = true) {
    round = { active: true, time: resetTime ? ROUND_SECONDS : round.time, score: 0, goal: goalFor(state.round), earned: 0, xp: 0, revived: false };
    els.gameOverModal.classList.add('hidden');
    render();
  }

  function tap(e) {
    if (!round.active) return;
    unlockAudio();
    const now = performance.now();
    combo = now - lastTap < 450 ? Math.min(10, combo + 0.2) : 1;
    lastTap = now;
    const gain = Math.ceil(state.tap * combo);
    round.score += gain; round.earned += gain; round.xp += 1;
    floatText(`+${gain}⭐`, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2);
    burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 8);
    beep(520, 0.035, 'square');
    if (round.score >= round.goal) endRound(true);
    render();
  }

  function endRound(win) {
    if (!round.active) return;
    round.active = false; state.roundsPlayed += 1;
    const baseReward = Math.floor(round.earned * (win ? 0.55 : 0.25)) + (win ? state.round * 12 : 5);
    const reward = doubleNext ? baseReward * 2 : baseReward;
    doubleNext = false; state.coins += reward; addXp(round.xp + (win ? 25 : 8));
    if (win) { state.round += 1; state.bestRound = Math.max(state.bestRound, state.round); if (state.round % 5 === 0) state.gems += 1; }
    saveLeaderboard(); save(); showGameOver(win, reward);
    if (state.roundsPlayed % 3 === 0) showInterstitial('round_cycle');
  }

  function showGameOver(win, reward) {
    els.resultEmoji.textContent = win ? '🏆' : '💥';
    els.resultTitle.textContent = win ? 'Раунд пройден!' : 'Почти получилось!';
    const left = Math.max(0, round.goal - round.score);
    els.resultText.textContent = win ? 'Забирай награду, покупай апгрейд и лети дальше.' : `Не хватило ${left} ⭐. Один апгрейд — и цель твоя!`;
    els.earnedText.textContent = `+${reward} ⭐`; els.xpEarnedText.textContent = `+${round.xp} XP`;
    els.reviveBtn.style.display = win || round.revived ? 'none' : 'block';
    els.gameOverModal.classList.remove('hidden');
    beep(win ? 760 : 160, 0.18, win ? 'triangle' : 'sawtooth'); render();
  }

  function addXp(v) { state.xp += v; while (state.xp >= xpNeed()) { state.xp -= xpNeed(); state.level += 1; state.gems += state.level % 3 === 0 ? 1 : 0; toast(`Уровень ${state.level}! Сила растёт 🚀`); } }
  function buy(type) {
    const cost = type === 'tap' ? tapCost() : idleCost();
    if (state.coins < cost) return toast('Не хватает звёзд. Сыграй ещё раунд!');
    state.coins -= cost;
    if (type === 'tap') { state.tapLvl++; state.tap += 1 + Math.floor(state.tapLvl / 5); }
    else { state.idleLvl++; state.idle += 1 + Math.floor(state.idleLvl / 4); }
    beep(690, .09, 'triangle'); burst(innerWidth / 2, innerHeight / 2, 24); save(); render();
  }

  function claimDaily() {
    const reward = 100 + state.streak * 35, gems = state.streak % 3 === 0 ? 1 : 0;
    state.coins += reward; state.gems += gems; state.lastDaily = today(); save();
    els.dailyModal.classList.add('hidden'); toast(`Ежедневно: +${reward}⭐ ${gems ? '+1💎' : ''}`); render();
  }
  function checkDaily() {
    const t = today(); if (state.lastDaily === t) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    state.streak = state.lastDaily === yesterday ? state.streak + 1 : 1;
    els.dailyText.textContent = `Серия ${state.streak} дн.: +${100 + state.streak * 35}⭐${state.streak % 3 === 0 ? ' и +1💎' : ''}. Возвращайся завтра за больше!`;
    els.dailyModal.classList.remove('hidden');
  }
  function today() { return new Date().toISOString().slice(0, 10); }

  function showRewardAd(reason, cb) {
    toast('📺 Реклама показана (VK Ads stub)');
    if (window.vkBridge) window.vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' }).catch(() => {});
    setTimeout(() => { cb(); save(); render(); }, 650);
  }
  function showInterstitial(place) {
    toast('📺 Interstitial: пауза между раундами');
    if (window.vkBridge) window.vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial', place }).catch(() => {});
  }
  function saveLeaderboard() { if (window.vkBridge) window.vkBridge.send('VKWebAppCallAPIMethod', { method: 'apps.setScore', params: { score: state.bestRound, v: '5.199' } }).catch(() => {}); }

  function render() {
    els.coins.textContent = Math.floor(state.coins); els.gems.textContent = state.gems; els.playerRank.textContent = rank();
    els.levelText.textContent = `Уровень ${state.level}`; els.powerText.textContent = `Сила ${state.tap + state.idle}/с`; els.xpBar.style.width = `${Math.min(100, state.xp / xpNeed() * 100)}%`;
    els.roundText.textContent = `Раунд ${state.round}`; els.timerText.textContent = `${Math.ceil(round.time)}с`; els.gainText.textContent = `+${state.tap} за тап`; els.goalText.textContent = `${round.score}/${round.goal} ⭐`; els.goalBar.style.width = `${Math.min(100, round.score / round.goal * 100)}%`;
    els.comboText.textContent = `Комбо x${combo.toFixed(1)}`; els.tapUpgradeText.textContent = `Цена ${tapCost()}⭐`; els.idleUpgradeText.textContent = `Цена ${idleCost()}⭐`;
  }

  function tick() {
    if (round.active) {
      round.time -= 1; const idleGain = state.idle; if (idleGain) { round.score += idleGain; round.earned += idleGain; }
      combo = Math.max(1, combo - .15); if (round.score >= round.goal) endRound(true); else if (round.time <= 0) endRound(false); render();
    }
  }
  function animate() { ctx.clearRect(0,0,els.canvas.width,els.canvas.height); particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;p.life-=.02;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();if(p.life<=0)particles.splice(i,1)}); ctx.globalAlpha=1; requestAnimationFrame(animate); }
  function resize() { els.canvas.width = innerWidth * devicePixelRatio; els.canvas.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
  function burst(x,y,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*8,vy:(Math.random()-.8)*8,r:2+Math.random()*5,life:1,c:['#ffcf33','#35e8ff','#ff4fb8','#52ff9d'][i%4]});}
  function floatText(t,x,y){const d=document.createElement('div');d.className='float';d.textContent=t;d.style.left=`${x-20}px`;d.style.top=`${y-20}px`;document.body.appendChild(d);setTimeout(()=>d.remove(),800)}
  function toast(t){els.toast.textContent=t;els.toast.classList.add('show');setTimeout(()=>els.toast.classList.remove('show'),1800)}
  function unlockAudio(){ if(audio) return; audio = new (window.AudioContext || window.webkitAudioContext)(); }
  function beep(freq,dur,type){ if(!state.sound) return; unlockAudio(); const o=audio.createOscillator(), g=audio.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=.04; o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime+dur); }

  els.coreButton.addEventListener('pointerdown', tap); els.tapUpgradeBtn.onclick=()=>buy('tap'); els.idleUpgradeBtn.onclick=()=>buy('idle');
  els.boostBtn.onclick=()=>showRewardAd('double',()=>{doubleNext=true;toast('Следующая награда x2!')});
  els.bonusBtn.onclick=()=>showRewardAd('bonus',()=>{const v=90+state.level*15;state.coins+=v;toast(`Бонус +${v}⭐`)});
  els.reviveBtn.onclick=()=>showRewardAd('revive',()=>{round.revived=true;round.active=true;round.time=20;els.gameOverModal.classList.add('hidden');toast('Возрождение: +20 секунд!')});
  els.doubleBtn.onclick=()=>showRewardAd('double_end',()=>{state.coins+=Math.max(25, Math.floor(round.earned*.35));els.doubleBtn.disabled=true;toast('Награда удвоена!')});
  els.restartBtn.onclick=()=>{showInterstitial('game_over_menu');startRound(true)}; els.claimDailyBtn.onclick=claimDaily;
  els.shareBtn.onclick=()=>{state.coins+=25; if(navigator.share) navigator.share({title:'Космо Кликер',text:'Побей мой раунд в Космо Кликере!',url:location.href}).catch(()=>{}); toast('Вирусный бонус +25⭐'); save(); render();};
  els.soundBtn.onclick=()=>{state.sound=!state.sound;els.soundBtn.textContent=state.sound?'🔊':'🔇';save();};
  addEventListener('resize', resize); resize(); initVK(); checkDaily(); render(); loopId=setInterval(tick,1000); animate();
})();
