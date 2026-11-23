(() => {
  const installedDisplay = matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)');
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safariVersion = Number(/Version\/(\d+)/.exec(navigator.userAgent)?.[1]);
  const isMacSafari = safariVersion >= 17 && /Macintosh/.test(navigator.userAgent)
    && /Safari\//.test(navigator.userAgent)
    && !/Chrome|Chromium|Edg|OPR|Firefox/.test(navigator.userAgent);
  const hasInstructions = isAppleMobile || isMacSafari;
  const copy = {
    pl: ['Zainstaluj grę', 'W Safari wybierz „Udostępnij”, potem „Dodaj do ekranu początkowego” i włącz „Otwórz jako aplikację internetową”.'],
    en: ['Install game', 'In Safari, choose Share, then Add to Home Screen and turn on Open as Web App.'],
    de: ['Spiel installieren', 'Wähle in Safari „Teilen“, dann „Zum Home-Bildschirm“ und aktiviere „Als Web-App öffnen“.'],
    es: ['Instalar juego', 'En Safari, toca Compartir, luego Añadir a pantalla de inicio y activa Abrir como app web.'],
    fr: ['Installer le jeu', 'Dans Safari, touchez Partager, puis Sur l’écran d’accueil et activez Ouvrir comme app web.'],
    it: ['Installa il gioco', 'In Safari, tocca Condividi, poi Aggiungi alla schermata Home e attiva Apri come app web.'],
    ar: ['تثبيت اللعبة', 'في سفاري، اختر «مشاركة»، ثم «إضافة إلى الشاشة الرئيسية»، وفعّل «فتح كتطبيق ويب».'],
    hi: ['गेम इंस्टॉल करें', 'Safari में शेयर करें, फिर होम स्क्रीन पर जोड़ें चुनें और वेब ऐप के रूप में खोलें चालू करें।'],
    uk: ['Установити гру', 'У Safari виберіть «Поділитися», потім «На початковий екран» і ввімкніть «Відкрити як вебпрограму».'],
    zh: ['安装游戏', '在 Safari 中选择“共享”，再选“添加到主屏幕”，然后开启“作为网页 App 打开”。']
  };
  const macHelp = {
    pl: 'W Safari wybierz „Plik” → „Dodaj do Docka”.',
    en: 'In Safari, choose File → Add to Dock.',
    de: 'Wähle in Safari „Ablage“ → „Zum Dock hinzufügen“.',
    es: 'En Safari, elige Archivo → Añadir al Dock.',
    fr: 'Dans Safari, choisissez Fichier → Ajouter au Dock.',
    it: 'In Safari, scegli File → Aggiungi al Dock.',
    ar: 'في سفاري، اختر «ملف» ← «إضافة إلى Dock».',
    hi: 'Safari में फ़ाइल → Dock में जोड़ें चुनें।',
    uk: 'У Safari виберіть «Файл» → «Додати на Dock».',
    zh: '在 Safari 中选择“文件”→“添加到程序坞”。',
  };
  let promptEvent;
  let installed = false;

  const panel = document.createElement('div');
  panel.className = 'game-install';
  panel.hidden = true;
  const button = document.createElement('button');
  button.type = 'button';
  const instructions = document.createElement('p');
  instructions.id = 'game-install-instructions';
  instructions.hidden = true;
  panel.append(button, instructions);
  document.querySelector('main').before(panel);

  function render() {
    const standalone = installedDisplay.matches || navigator.standalone === true;
    panel.hidden = installed || standalone || (!promptEvent && !hasInstructions);
    const lang = document.documentElement.lang.split('-')[0];
    const [label, help] = copy[lang] ?? copy.en;
    button.textContent = label;
    instructions.textContent = isAppleMobile ? help : macHelp[lang] ?? macHelp.en;
    if (hasInstructions && !promptEvent) {
      button.setAttribute('aria-controls', instructions.id);
      button.setAttribute('aria-expanded', String(!instructions.hidden));
    } else {
      instructions.hidden = true;
      button.removeAttribute('aria-controls');
      button.removeAttribute('aria-expanded');
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptEvent = event;
    render();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    promptEvent = undefined;
    render();
  });
  button.addEventListener('click', async () => {
    if (!promptEvent) {
      instructions.hidden = !instructions.hidden;
      render();
      return;
    }
    const request = promptEvent;
    promptEvent = undefined;
    button.disabled = true;
    try {
      await request.prompt();
      installed ||= (await request.userChoice).outcome === 'accepted';
    } catch { /* The browser can withdraw an installation offer. */ }
    finally {
      button.disabled = false;
      render();
    }
  });
  installedDisplay.addEventListener('change', render);
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
})();
