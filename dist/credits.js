import { direction, gameName, languages, translate } from './locale.js?v=29';

const descriptions = {
  pl: ['Zasady i punktacja pochodzą ze źródeł [Kierek Roberta Walczyńskiego].', 'Wspólna ikona ustawień, palety, efekty zwycięstwa i ilustracje motywów pochodzą z Games Chest. Zobacz [autorów i licencje Ośmiu Asów].', 'Ilustracje figur pochodzą z [English Pattern · Dmitry Fomin], udostępnionej na licencji [CC0 1.0].', 'Ilustrację ikony wygenerowano za pomocą OpenAI ImageGen.'],
  en: ['The rules and scoring come from [Robert Walczyński’s Kierki source code].', 'The shared settings icon, palettes, victory effects and theme illustrations come from Games Chest. See the [Eight Aces credits and licenses].', 'Court illustrations come from [English Pattern · Dmitry Fomin], released under [CC0 1.0].', 'The game icon was generated with OpenAI ImageGen.'],
  de: ['Regeln und Wertung stammen aus [Robert Walczyńskis Kierki-Quellcode].', 'Einstellungssymbol, Farbpaletten, Siegereffekte und Designillustrationen stammen von Games Chest. Siehe [Mitwirkende und Lizenzen von Acht Asse].', 'Die Kartenfiguren stammen aus dem Kartenspiel [English Pattern · Dmitry Fomin] unter [CC0 1.0].', 'Das Spielsymbol wurde mit OpenAI ImageGen erstellt.'],
  es: ['Las reglas y la puntuación proceden del [código fuente de Kierki de Robert Walczyński].', 'El icono de ajustes, las paletas, los efectos de victoria y las ilustraciones de temas proceden de Games Chest. Consulta [los créditos y licencias de Ocho ases].', 'Las figuras proceden de [English Pattern · Dmitry Fomin], disponible bajo [CC0 1.0].', 'El icono del juego se generó con OpenAI ImageGen.'],
  fr: ['Les règles et les scores proviennent du [code source de Kierki de Robert Walczyński].', 'L’icône de paramètres, les palettes, les effets de victoire et les illustrations des thèmes proviennent de Games Chest. Voir les [crédits et licences de Huit as].', 'Les figures proviennent du jeu [English Pattern · Dmitry Fomin], publié sous [CC0 1.0].', 'L’icône du jeu a été générée avec OpenAI ImageGen.'],
  it: ['Le regole e il punteggio provengono dal [codice sorgente di Kierki di Robert Walczyński].', 'L’icona delle impostazioni, le palette, gli effetti di vittoria e le illustrazioni dei temi provengono da Games Chest. Consulta i [crediti e le licenze di Otto assi].', 'Le figure provengono dal mazzo [English Pattern · Dmitry Fomin], pubblicato con [CC0 1.0].', 'L’icona del gioco è stata generata con OpenAI ImageGen.'],
  uk: ['Правила й підрахунок очок ґрунтуються на [вихідному коді Kierki Роберта Вальчинського].', 'Піктограма налаштувань, палітри, ефекти перемоги й ілюстрації тем походять із Games Chest. Див. [авторів і ліцензії «Вісім тузів»].', 'Зображення фігур походять із [English Pattern · Dmitry Fomin], опублікованої за ліцензією [CC0 1.0].', 'Піктограму гри створено за допомогою OpenAI ImageGen.'],
  ar: ['تستند القواعد والنقاط إلى [الشفرة المصدرية للعبة Kierki من روبرت فالتشينسكي].', 'أيقونة الإعدادات والألوان وتأثيرات الفوز ورسوم المظاهر من Games Chest. راجع [المساهمين والتراخيص للعبة ثمانية آسات].', 'صور بطاقات الشخصيات من [English Pattern · Dmitry Fomin] المنشورة بموجب [CC0 1.0].', 'أُنشئت أيقونة اللعبة باستخدام OpenAI ImageGen.'],
  hi: ['नियम और स्कोर [रॉबर्ट वाल्चिन्स्की के Kierki स्रोत कोड] से लिए गए हैं।', 'सेटिंग का आइकन, रंग, जीत के प्रभाव और थीम के चित्र Games Chest से हैं। [आठ इक्के के श्रेय और लाइसेंस] देखें।', 'चित्र वाले पत्ते [English Pattern · Dmitry Fomin] से हैं, जो [CC0 1.0] के तहत उपलब्ध है।', 'खेल का आइकन OpenAI ImageGen से बनाया गया है।'],
  'zh-Hans': ['游戏规则和计分来自[罗伯特·瓦尔钦斯基的 Kierki 源代码]。', '设置图标、配色、胜利特效和主题插图来自 Games Chest。请参见[八张王牌的制作人员与许可]。', '人头牌插图来自[English Pattern · Dmitry Fomin]，以 [CC0 1.0] 发布。', '游戏图标使用 OpenAI ImageGen 生成。']
};
const sources = [
  'https://github.com/walczynskir/Kierki',
  'https://eightaces.games-chest.com/credits.html',
  'https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg',
  'https://creativecommons.org/publicdomain/zero/1.0/'
];
const requested = new URLSearchParams(location.search).get('lang');
const language = languages.includes(requested) ? requested : 'pl';
document.documentElement.lang = language;
document.documentElement.dir = direction(language);
const heading = translate('Autorzy i licencje', language);
document.title = heading + ' · ' + gameName(language);
document.querySelector('h1').textContent = heading;
document.querySelector('#back').textContent = '← ' + gameName(language);

let sourceIndex = 0;
document.querySelector('#credits').replaceChildren(...descriptions[language].map(text => {
  const item = document.createElement('p');
  for (const [index, part] of text.split(/\[([^\]]+)\]/).entries()) {
    if (index % 2 === 0) item.append(part);
    else {
      const link = document.createElement('a');
      link.href = sources[sourceIndex++];
      link.textContent = part;
      item.append(link);
    }
  }
  return item;
}));
