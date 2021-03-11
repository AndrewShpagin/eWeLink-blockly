/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-cycle */
/* eslint-disable no-param-reassign */
/* eslint-disable import/prefer-default-export */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
// import './css/bootstrap-reboot.css';
// import './css/main.css';
import { applyLocale, getUserData } from './workspace';
import { helpShown, refreshui, forceSlideshow } from './ui';
// eslint-disable-next-line camelcase
import text_en from '../public/translations/site_en.json';
// eslint-disable-next-line camelcase
import text_ru from '../public/translations/site_ru.json';

const langScope = {
  en: text_en,
  ru: text_ru,
};

export const isMobile = {
  Android() {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry() {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera() {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows() {
    return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
  },
  any() {
    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
  },
};

function applyLanguage(pl) {
  const lang = curLanguage();
  const culang = langScope[lang];
  document.querySelectorAll('*').forEach(node => {
    if (node.hasAttribute('tid')) {
      let inn = node.innerHTML;
      let idx = inn.indexOf('</i>');
      if (idx < 0)idx = 0; else idx += 4;
      inn = inn.substring(0, idx);
      node.innerHTML = inn + culang[node.getAttribute('tid')];
    }
  });
}
function setLang(language) {
  let lang = curLanguage();
  if (lang === 'ru')lang = 'en';
  else lang = 'ru';
  if (language && language.length) lang = language;
  window.localStorage.setItem('Language', lang);
  applyLanguage();
  applyLocale(curLanguage());
  refreshui();
}

applyLanguage();

export function textByID(id) {
  const culang = langScope[curLanguage()];
  return culang[id] || id;
}

if (!localStorage.getItem('autocountry')) {
  $.get('https://api.ipdata.co?api-key=f58ae16e314a90471e213046735443ea0441711a4209d951125a9356',
    response => {
      const country = response.country_code;
      console.log(country);
      localStorage.setItem('autocountry', country);
      let needlang = 'en';
      if (country === 'UA' || country === 'RU') needlang = 'ru';
      if (curLanguage() !== needlang) {
        setLang(needlang);
        if (helpShown()) {
          forceSlideshow();
        }
      }
    }, 'jsonp');
}

export function curLanguage() {
  let lang = window.localStorage.getItem('Language');
  if (!lang)lang = 'en';
  return lang;
}

export function translateToCurrent(str) {
  for (const [lname, lang] of Object.entries(langScope)) {
    for (const [key, value] of Object.entries(lang)) {
      if (value === str) {
        return textByID(key);
      }
    }
  }
  return str;
}

function show(el, state) {
  document.getElementById(el).style.display = state ? 'inherit' : 'none';
}
export function correctHeader() {
  if (getUserData()) {
    show('DEVLOGIN', false);
    show('LOGOUT', true);
  } else {
    show('DEVLOGIN', true);
    show('LOGOUT', false);
  }
}

correctHeader();

window.isMobile = isMobile;
window.applyLanguage = applyLanguage;
window.setLang = setLang;
window.textByID = textByID;
window.curLanguage = curLanguage;
window.correctHeader = correctHeader;
