/* =========================================
   NORD PROGRAMME - AL-QURAN APPLICATION
   ========================================= */
'use strict';

const API_BASE = 'https://api.quran.com/api/v4';
const AUDIO_API_BASE = 'https://www.mp3quran.net/api/v3';

// Translation IDs for Quran.com
const TRANSLATION_MAP = {
    'en': 20, 'ar': null, 'fr': 31, 'bn': 161,
    'ur': 97, 'id': 33, 'tr': 77, 'ru': 79
};

// MP3Quran language codes
const MP3QURAN_LANG_MAP = {
    'en': 'eng', 'ar': 'ar', 'fr': 'fr', 'ru': 'ru'
};

// UI Translations
const UI_TRANSLATIONS = {
    'en': {
        app_title: 'Al-Quran', search_placeholder: 'Search...',
        hero_title: 'The Holy Quran', hero_subtitle: 'Read, study, and learn The Noble Quran.',
        back_to_surahs: 'Back to Surahs', verses: 'Verses', no_surahs: 'No Surahs found.',
        tab_read: 'Read', tab_listen: 'Listen', tab_radios: 'Radios',
        reciters_title: 'Audio Recitations', reciters_subtitle: 'Listen to beautiful recitations of the Quran.',
        radios_title: 'Live Radios', radios_subtitle: '24/7 continuous Quran broadcasts.',
        back_to_reciters: 'Back to Reciters', play: 'Play', download: 'Download',
        download_all: 'Download All', downloading_files: 'Downloading Files...', cancel: 'Cancel',
        download_all_not_supported: 'Your browser does not support folder selection for bulk download. Fallback standard downloads will start.',
        listen_live: 'Listen Live', now_playing: 'Now Playing',
        download_started: 'Download started...', download_complete: 'Download complete!',
        download_error: 'Download failed. Try again.',
        audio_error: 'Audio playback error. Please try another source.',
        error_loading: 'Error loading data. Please try again.', error_verses: 'Error loading verses.',
        built_with: 'Built with', by: 'by', retry: 'Retry'
    },
    'ar': {
        app_title: 'القرآن الكريم', search_placeholder: 'ابحث...',
        hero_title: 'القرآن الكريم', hero_subtitle: 'اقرأ وادرس وتعلم القرآن الكريم.',
        back_to_surahs: 'العودة للسور', verses: 'آيات', no_surahs: 'لم يتم العثور على سور.',
        tab_read: 'قراءة', tab_listen: 'استماع', tab_radios: 'إذاعات',
        reciters_title: 'التلاوات الصوتية', reciters_subtitle: 'استمع لأعذب تلاوات القرآن الكريم.',
        radios_title: 'الإذاعات المباشرة', radios_subtitle: 'بث قرآني على مدار الساعة.',
        back_to_reciters: 'العودة للقراء', play: 'تشغيل', download: 'تحميل',
        download_all: 'تحميل الكل', downloading_files: 'جاري تحميل الملفات...', cancel: 'إلغاء',
        download_all_not_supported: 'متصفحك لا يدعم اختيار المجلدات للتحميل المتعدد. ستبدأ عمليات التحميل العادية تباعاً.',
        listen_live: 'استمع مباشرة', now_playing: 'يُعرض الآن',
        download_started: 'جاري التحميل...', download_complete: 'تم التحميل بنجاح!',
        download_error: 'فشل التحميل. حاول مرة أخرى.',
        audio_error: 'خطأ في تشغيل الصوت. جرب مصدراً آخر.',
        error_loading: 'خطأ في تحميل البيانات.', error_verses: 'خطأ في تحميل الآيات.',
        built_with: 'تم البناء بـ', by: 'بواسطة', retry: 'إعادة المحاولة'
    }
};

// ----- Utility: Text Sanitization (XSS Prevention) -----
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function getTranslation(key) {
    const t = UI_TRANSLATIONS[currentLang] || UI_TRANSLATIONS['en'];
    return t[key] || UI_TRANSLATIONS['en'][key] || key;
}

// ==========================================
// STATE
// ==========================================
let currentLang = 'en';
let allSurahs = [];
let allReciters = [];
let allRadios = [];
let currentSurahId = null;
let currentRadioCardEl = null;  // track active radio card for highlighting
let isRadioStream = false;      // track if current audio is a live radio

// Bulk Download State
let activeBulkDownload = false;
let currentReciterSurahsToDownload = [];

// ==========================================
// DOM REFERENCES
// ==========================================
const $ = (id) => document.getElementById(id);

const brandLogo = $('brand-logo');
const langSelect = $('lang-select');
const searchInput = $('search-input');
const themeToggle = $('theme-toggle');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Reader
const surahListView = $('surah-list-view');
const surahDetailView = $('surah-detail-view');
const surahGrid = $('surah-grid');
const versesContainer = $('verses-container');
const detailSurahName = $('detail-surah-name');
const detailSurahTrans = $('detail-surah-trans');
const detailSurahType = $('detail-surah-type');
const detailSurahVerses = $('detail-surah-verses');

// Reciters
const recitersListView = $('reciters-list-view');
const reciterDetailView = $('reciter-detail-view');
const recitersGrid = $('reciters-grid');
const reciterSurahsGrid = $('reciter-surahs-grid');
const detailReciterName = $('detail-reciter-name');
const detailReciterRewaya = $('detail-reciter-rewaya');
const downloadAllBtn = $('download-all-btn');

// Bulk Download Modal
const downloadModal = $('download-modal');
const downloadModalStatus = $('download-modal-status');
const downloadProgressFill = $('download-progress-fill');
const downloadModalFilename = $('download-modal-filename');
const cancelDownloadBtn = $('cancel-download-btn');

// Radios
const radiosGrid = $('radios-grid');

// Audio Player
const audioElement = $('audio-element');
const audioPlayerContainer = $('audio-player-container');
const playerPlayBtn = $('player-play-btn');
const playerCloseBtn = $('player-close-btn');
const playerTitle = $('player-title');
const playerSubtitle = $('player-subtitle');
const playerProgress = $('player-progress');
const playerTimeCurrent = $('player-time-current');
const playerTimeTotal = $('player-time-total');
const playerVolumeSlider = $('player-volume-slider');
const playerIconWrapper = $('player-icon-wrapper');

// Spinners
const loadingSpinner = $('loading-spinner');
const detailLoadingSpinner = $('detail-loading-spinner');
const recitersLoadingSpinner = $('reciters-loading-spinner');
const radiosLoadingSpinner = $('radios-loading-spinner');

// Toast Container
const toastContainer = $('toast-container');

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
    loadTheme();
    loadLanguage();
    setupLanguages();
    updateUIText();
    setupEventListeners();

    // Parallel fetch for faster startup
    await Promise.allSettled([
        fetchSurahs(),
        fetchReciters(),
        fetchRadios()
    ]);
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = { info: 'fa-circle-info', success: 'fa-circle-check', error: 'fa-circle-exclamation' };
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" aria-hidden="true"></i> ${escapeHtml(message)}`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==========================================
// THEME
// ==========================================
function loadTheme() {
    const saved = localStorage.getItem('nordTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
}

function toggleTheme() {
    const curr = document.documentElement.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nordTheme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    themeToggle.querySelector('i').className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}

// ==========================================
// LANGUAGE / I18N
// ==========================================
function loadLanguage() {
    const saved = localStorage.getItem('nordLang');
    if (saved) currentLang = saved;
}

function updateUIText() {
    const rtlLangs = ['ar', 'ur'];
    document.documentElement.dir = rtlLangs.includes(currentLang) ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = getTranslation(key);
        if (val) el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const val = getTranslation(key);
        if (val) el.setAttribute('placeholder', val);
    });
}

function setupLanguages() {
    const langs = [
        { code: 'en', name: 'English' }, { code: 'ar', name: 'العربية' },
        { code: 'fr', name: 'Français' }, { code: 'bn', name: 'বাংলা' },
        { code: 'ur', name: 'اردو' }, { code: 'id', name: 'Indonesia' },
        { code: 'tr', name: 'Türkçe' }, { code: 'ru', name: 'Русский' }
    ];
    langSelect.innerHTML = '';
    langs.forEach(lang => {
        const opt = document.createElement('option');
        opt.value = lang.code;
        opt.textContent = lang.name;
        if (lang.code === currentLang) opt.selected = true;
        langSelect.appendChild(opt);
    });
}

// ==========================================
// TAB NAVIGATION
// ==========================================
function switchTab(targetId) {
    tabBtns.forEach(btn => {
        const active = btn.getAttribute('data-tab') === targetId;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active);
    });
    tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetId));
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchReaderView(view) {
    surahListView.classList.toggle('active', view === 'list');
    surahDetailView.classList.toggle('active', view === 'detail');
    if (view === 'list') window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchReciterView(view) {
    recitersListView.classList.toggle('active', view === 'list');
    reciterDetailView.classList.toggle('active', view === 'detail');
    if (view === 'list') window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// READER LOGIC (Quran.com API)
// ==========================================
async function fetchSurahs() {
    loadingSpinner.style.display = 'block';
    surahGrid.style.display = 'none';
    try {
        const resp = await fetch(`${API_BASE}/chapters?language=${currentLang}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.chapters) {
            allSurahs = data.chapters;
            renderSurahs(allSurahs);
        }
    } catch (e) {
        console.error('fetchSurahs:', e);
        surahGrid.innerHTML = `<p style="text-align:center;grid-column:1/-1;">${escapeHtml(getTranslation('error_loading'))}</p>`;
    } finally {
        loadingSpinner.style.display = 'none';
        surahGrid.style.display = 'grid';
    }
}

function renderSurahs(surahs) {
    surahGrid.innerHTML = '';
    if (!surahs.length) {
        surahGrid.innerHTML = `<p style="text-align:center;grid-column:1/-1;">${escapeHtml(getTranslation('no_surahs'))}</p>`;
        return;
    }
    const frag = document.createDocumentFragment();
    surahs.forEach(s => {
        const card = document.createElement('div');
        card.className = 'surah-card glass-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.onclick = () => openSurah(s.id);
        card.onkeydown = (e) => { if (e.key === 'Enter') openSurah(s.id); };
        card.innerHTML = `
            <div class="surah-number">${s.id}</div>
            <div class="surah-info">
                <h3>${escapeHtml(s.name_simple)}</h3>
                <p>${escapeHtml(s.translated_name?.name || '')} • ${s.verses_count} ${escapeHtml(getTranslation('verses'))}</p>
            </div>
            <div class="surah-arabic-name">${escapeHtml(s.name_arabic)}</div>
        `;
        frag.appendChild(card);
    });
    surahGrid.appendChild(frag);
}

async function openSurah(id) {
    currentSurahId = id;
    switchReaderView('detail');
    detailLoadingSpinner.style.display = 'block';
    versesContainer.style.display = 'none';

    try {
        const surah = allSurahs.find(s => s.id === id);
        if (surah) {
            detailSurahName.textContent = surah.name_arabic;
            detailSurahTrans.textContent = surah.name_simple;
            detailSurahType.textContent = surah.revelation_place;
            detailSurahVerses.innerHTML = `${surah.verses_count} <span>${escapeHtml(getTranslation('verses'))}</span>`;
        }

        const transId = TRANSLATION_MAP[currentLang];
        let url = `${API_BASE}/verses/by_chapter/${id}?language=${currentLang}&words=false&fields=text_uthmani`;
        if (transId) url += `&translations=${transId}`;

        let verses = [], page = 1, totalPages = 1;
        do {
            const resp = await fetch(`${url}&page=${page}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            verses = verses.concat(data.verses);
            totalPages = data.pagination.total_pages;
            page++;
        } while (page <= totalPages);

        renderVerses(verses, surah?.bismillah_pre);
    } catch (e) {
        console.error('openSurah:', e);
        versesContainer.innerHTML = `<p style="text-align:center;">${escapeHtml(getTranslation('error_verses'))}</p>`;
    } finally {
        detailLoadingSpinner.style.display = 'none';
        versesContainer.style.display = 'flex';
    }
}

function renderVerses(verses, showBismillah) {
    versesContainer.innerHTML = '';
    const frag = document.createDocumentFragment();

    if (showBismillah) {
        const bism = document.createElement('div');
        bism.className = 'bismillah';
        bism.textContent = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
        frag.appendChild(bism);
    }

    verses.forEach(v => {
        const card = document.createElement('div');
        card.className = 'verse-card glass-card';
        let tHtml = '';
        if (v.translations?.length > 0) {
            // translations may contain HTML tags from the API (e.g. <sup>), keep them
            tHtml = `<div class="verse-translation">${v.translations[0].text}</div>`;
        }
        card.innerHTML = `
            <div class="verse-header">
                <div class="verse-number">${v.verse_number}</div>
                <div class="verse-actions"><i class="fa-regular fa-bookmark" aria-hidden="true"></i></div>
            </div>
            <div class="verse-arabic">${v.text_uthmani}</div>
            ${tHtml}
        `;
        frag.appendChild(card);
    });
    versesContainer.appendChild(frag);
}

// ==========================================
// RECITERS LOGIC (mp3quran.net API)
// ==========================================
async function fetchReciters() {
    recitersLoadingSpinner.style.display = 'block';
    recitersGrid.style.display = 'none';
    const apiLang = MP3QURAN_LANG_MAP[currentLang] || 'ar';
    try {
        const resp = await fetch(`${AUDIO_API_BASE}/reciters?language=${apiLang}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.reciters) {
            allReciters = data.reciters;
            renderReciters(allReciters);
        }
    } catch (e) {
        console.error('fetchReciters:', e);
        recitersGrid.innerHTML = `<p style="text-align:center;grid-column:1/-1;">${escapeHtml(getTranslation('error_loading'))}</p>`;
    } finally {
        recitersLoadingSpinner.style.display = 'none';
        recitersGrid.style.display = 'grid';
    }
}

function renderReciters(reciters) {
    recitersGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    reciters.forEach(r => {
        const card = document.createElement('div');
        card.className = 'surah-card glass-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.onclick = () => openReciter(r);
        card.onkeydown = (e) => { if (e.key === 'Enter') openReciter(r); };

        const initial = r.name ? r.name.charAt(0).toUpperCase() : '?';
        const moshafName = r.moshaf?.length > 0 ? escapeHtml(r.moshaf[0].name) : '';

        card.innerHTML = `
            <div class="reciter-avatar">${escapeHtml(initial)}</div>
            <div class="surah-info">
                <h3>${escapeHtml(r.name)}</h3>
                <p style="color:var(--nord8);margin-top:4px;">${moshafName}</p>
            </div>
        `;
        frag.appendChild(card);
    });
    recitersGrid.appendChild(frag);
}

function openReciter(reciter) {
    switchReciterView('detail');
    detailReciterName.textContent = reciter.name;
    const moshaf = reciter.moshaf[0];
    detailReciterRewaya.textContent = moshaf.name;

    reciterSurahsGrid.innerHTML = '';
    const ids = moshaf.surah_list.split(',').map(Number);
    const frag = document.createDocumentFragment();
    
    currentReciterSurahsToDownload = [];

    ids.forEach(id => {
        const surah = allSurahs.find(s => s.id === id);
        if (!surah) return;

        const audioUrl = buildAudioUrl(moshaf.server, id);
        
        currentReciterSurahsToDownload.push({
            id: surah.id,
            url: audioUrl,
            filename: `${surah.id.toString().padStart(3, '0')} - ${surah.name_simple}.mp3`
        });

        const card = document.createElement('div');
        card.className = 'surah-card glass-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        card.innerHTML = `
            <div style="display:flex; align-items:center; flex:1;">
                <div class="surah-number">${surah.id}</div>
                <div class="surah-info">
                    <h3 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${escapeHtml(surah.name_simple)}</h3>
                    <p style="color:var(--nord8); margin-top: 4px;"><i class="fa-solid fa-play" aria-hidden="true"></i> ${escapeHtml(getTranslation('play'))}</p>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; justify-content:flex-end;">
                <div class="surah-arabic-name" style="margin-right: 0.5rem;">${escapeHtml(surah.name_arabic)}</div>
                <button class="download-btn" title="${escapeHtml(getTranslation('download'))}" aria-label="${escapeHtml(getTranslation('download'))} ${escapeHtml(surah.name_simple)}">
                    <i class="fa-solid fa-download" aria-hidden="true"></i>
                </button>
            </div>
        `;

        // Play handler on the card (but not the download btn)
        card.addEventListener('click', (e) => {
            if (e.target.closest('.download-btn')) return;
            playAudio(moshaf.server, surah.id, reciter.name, surah.name_simple);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.target.closest('.download-btn'))
                playAudio(moshaf.server, surah.id, reciter.name, surah.name_simple);
        });

        // Download handler
        const dlBtn = card.querySelector('.download-btn');
        dlBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadAudio(audioUrl, `${surah.name_simple}.mp3`, dlBtn);
        });

        frag.appendChild(card);
    });
    reciterSurahsGrid.appendChild(frag);
}

// ==========================================
// RADIOS LOGIC
// ==========================================
async function fetchRadios() {
    radiosLoadingSpinner.style.display = 'block';
    radiosGrid.style.display = 'none';
    const apiLang = MP3QURAN_LANG_MAP[currentLang] || 'ar';
    try {
        const resp = await fetch(`${AUDIO_API_BASE}/radios?language=${apiLang}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.radios) {
            allRadios = data.radios;
            renderRadios(allRadios);
        }
    } catch (e) {
        console.error('fetchRadios:', e);
        radiosGrid.innerHTML = `<p style="text-align:center;grid-column:1/-1;">${escapeHtml(getTranslation('error_loading'))}</p>`;
    } finally {
        radiosLoadingSpinner.style.display = 'none';
        radiosGrid.style.display = 'grid';
    }
}

function renderRadios(radios) {
    radiosGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    radios.forEach(r => {
        const card = document.createElement('div');
        card.className = 'surah-card glass-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-radio-url', r.url);
        card.onclick = () => playRadio(r, card);
        card.onkeydown = (e) => { if (e.key === 'Enter') playRadio(r, card); };

        card.innerHTML = `
            <div style="display:flex; align-items:center; gap: 1rem; width: 100%;">
                <div class="radio-icon is-live"><i class="fa-solid fa-tower-broadcast" aria-hidden="true"></i></div>
                <div class="surah-info" style="margin: 0; flex: 1;">
                    <h3 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${escapeHtml(r.name)}</h3>
                    <p style="color:var(--nord8);margin-top:4px;"><i class="fa-solid fa-play" aria-hidden="true"></i> ${escapeHtml(getTranslation('listen_live'))}</p>
                </div>
            </div>
        `;
        frag.appendChild(card);
    });
    radiosGrid.appendChild(frag);
}

function autoPlayRadio() {
    if (!allRadios.length) return;
    const randomIdx = Math.floor(Math.random() * Math.min(allRadios.length, 10));
    const radio = allRadios[randomIdx];
    // Find the card element
    const cards = radiosGrid.querySelectorAll('.surah-card');
    const card = cards[randomIdx] || cards[0];
    if (radio && card) {
        playRadio(radio, card);
    }
}

function playRadio(radio, cardEl) {
    // Deselect previous
    if (currentRadioCardEl) currentRadioCardEl.classList.remove('radio-active');
    cardEl.classList.add('radio-active');
    currentRadioCardEl = cardEl;

    isRadioStream = true;
    playAudio(radio.url, null, getTranslation('listen_live'), radio.name);
}

// ==========================================
// AUDIO PLAYER
// ==========================================
function buildAudioUrl(baseUrl, surahId) {
    let url = baseUrl;
    if (!url.endsWith('/')) url += '/';
    return `${url}${surahId.toString().padStart(3, '0')}.mp3`;
}

function formatTime(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function playAudio(baseUrl, surahId, subtitle, title) {
    audioPlayerContainer.style.display = 'flex';
    document.body.classList.add('player-open');
    playerTitle.textContent = title;
    playerSubtitle.textContent = subtitle;

    let audioUrl = baseUrl;
    if (surahId) {
        isRadioStream = false;
        audioUrl = buildAudioUrl(baseUrl, surahId);
    }

    // Show spinning icon while loading
    playerIconWrapper.classList.add('spinning');

    audioElement.src = audioUrl;
    audioElement.play().catch(e => {
        console.error('Audio play error:', e);
        showToast(getTranslation('audio_error'), 'error');
        playerIconWrapper.classList.remove('spinning');
    });

    playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>';

    // Hide progress for live streams
    const progressContainer = document.querySelector('.player-progress-container');
    if (isRadioStream) {
        progressContainer.style.display = 'none';
    } else {
        progressContainer.style.display = 'flex';
    }
}

// Audio events
audioElement.addEventListener('playing', () => {
    playerIconWrapper.classList.remove('spinning');
});

audioElement.addEventListener('timeupdate', () => {
    if (isRadioStream) return;
    playerTimeCurrent.textContent = formatTime(audioElement.currentTime);
    if (audioElement.duration && isFinite(audioElement.duration)) {
        playerTimeTotal.textContent = formatTime(audioElement.duration);
        playerProgress.value = (audioElement.currentTime / audioElement.duration) * 100;
    }
});

audioElement.addEventListener('ended', () => {
    playerPlayBtn.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
    playerProgress.value = 0;
    playerTimeCurrent.textContent = '00:00';
});

audioElement.addEventListener('error', () => {
    showToast(getTranslation('audio_error'), 'error');
    playerIconWrapper.classList.remove('spinning');
    playerPlayBtn.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
});

playerProgress.addEventListener('input', (e) => {
    if (audioElement.duration && isFinite(audioElement.duration)) {
        audioElement.currentTime = (e.target.value / 100) * audioElement.duration;
    }
});

playerVolumeSlider.addEventListener('input', (e) => {
    audioElement.volume = e.target.value / 100;
    const volIcon = $('volume-icon');
    if (e.target.value == 0) volIcon.className = 'fa-solid fa-volume-xmark';
    else if (e.target.value < 50) volIcon.className = 'fa-solid fa-volume-low';
    else volIcon.className = 'fa-solid fa-volume-high';
});

playerPlayBtn.addEventListener('click', () => {
    if (audioElement.paused) {
        audioElement.play().catch(() => showToast(getTranslation('audio_error'), 'error'));
        playerPlayBtn.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>';
    } else {
        audioElement.pause();
        playerPlayBtn.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
    }
});

playerCloseBtn.addEventListener('click', () => {
    audioElement.pause();
    audioElement.src = '';
    audioPlayerContainer.style.display = 'none';
    document.body.classList.remove('player-open');
    if (currentRadioCardEl) {
        currentRadioCardEl.classList.remove('radio-active');
        currentRadioCardEl = null;
    }
    isRadioStream = false;
});

// Set initial volume
audioElement.volume = 0.8;

// ==========================================
// DOWNLOAD FEATURE (Bulk & Single)
// ==========================================
async function downloadAudio(url, filename, btnEl) {
    if (btnEl.classList.contains('downloading')) return;
    btnEl.classList.add('downloading');
    btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
    showToast(getTranslation('download_started'), 'info');

    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        showToast(getTranslation('download_complete'), 'success');
    } catch (e) {
        console.error('Download error:', e);
        showToast(getTranslation('download_error'), 'error');
    } finally {
        btnEl.classList.remove('downloading');
        btnEl.innerHTML = '<i class="fa-solid fa-download" aria-hidden="true"></i>';
    }
}

async function bulkDownloadSurahs() {
    if (currentReciterSurahsToDownload.length === 0) return;
    
    // Check for File System Access API support
    if (!window.showDirectoryPicker) {
        showToast(getTranslation('download_all_not_supported'), 'info', 5000);
        fallbackSequentialDownload();
        return;
    }

    try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        
        activeBulkDownload = true;
        downloadModal.style.display = 'flex';
        
        const total = currentReciterSurahsToDownload.length;
        
        for (let i = 0; i < total; i++) {
            if (!activeBulkDownload) break; // cancelled
            
            const item = currentReciterSurahsToDownload[i];
            downloadModalStatus.textContent = `${i + 1} / ${total}`;
            downloadProgressFill.style.width = `${((i + 1) / total) * 100}%`;
            downloadModalFilename.textContent = item.filename;
            
            try {
                const response = await fetch(item.url);
                if (!response.ok) throw new Error(`Failed to fetch ${item.filename}`);
                
                const blob = await response.blob();
                const fileHandle = await dirHandle.getFileHandle(item.filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
            } catch (err) {
                console.error('Failed to download file:', item.filename, err);
                // Continue to next file even if one fails
            }
        }
        
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('Directory picker error:', e);
            showToast('Permission denied or error selecting folder.', 'error');
        }
    } finally {
        activeBulkDownload = false;
        downloadModal.style.display = 'none';
        showToast(getTranslation('download_complete'), 'success');
    }
}

async function fallbackSequentialDownload() {
    activeBulkDownload = true;
    downloadModal.style.display = 'flex';
    
    const total = currentReciterSurahsToDownload.length;
    
    for (let i = 0; i < total; i++) {
        if (!activeBulkDownload) break;
        
        const item = currentReciterSurahsToDownload[i];
        downloadModalStatus.textContent = `${i + 1} / ${total}`;
        downloadProgressFill.style.width = `${((i + 1) / total) * 100}%`;
        downloadModalFilename.textContent = item.filename;
        
        // Standard anchor tag download
        const a = document.createElement('a');
        a.href = item.url;
        a.download = item.filename;
        // target blank helps in some browsers for sequential downloads without overriding each other
        a.target = '_blank'; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Delay 1.5s between downloads to not overwhelm browser
        await new Promise(r => setTimeout(r, 1500));
    }
    
    activeBulkDownload = false;
    downloadModal.style.display = 'none';
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);

    langSelect.addEventListener('change', async (e) => {
        currentLang = e.target.value;
        localStorage.setItem('nordLang', currentLang);
        updateUIText();
        await Promise.allSettled([fetchSurahs(), fetchReciters(), fetchRadios()]);
        if (currentSurahId && surahDetailView.classList.contains('active')) {
            openSurah(currentSurahId);
        }
    });

    searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();

        // Reader tab
        if ($('tab-reader').classList.contains('active')) {
            if (surahDetailView.classList.contains('active')) switchReaderView('list');
            if (!q) { renderSurahs(allSurahs); return; }
            renderSurahs(allSurahs.filter(s =>
                `${s.name_simple} ${s.name_arabic} ${s.translated_name?.name || ''}`.toLowerCase().includes(q)
            ));
        }

        // Reciters tab
        if ($('tab-reciters').classList.contains('active')) {
            if (reciterDetailView.classList.contains('active')) switchReciterView('list');
            if (!q) { renderReciters(allReciters); return; }
            renderReciters(allReciters.filter(r => r.name.toLowerCase().includes(q)));
        }

        // Radios tab
        if ($('tab-radios').classList.contains('active')) {
            if (!q) { renderRadios(allRadios); return; }
            renderRadios(allRadios.filter(r => r.name.toLowerCase().includes(q)));
        }
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
            searchInput.value = '';
        });
    });

    $('back-button').addEventListener('click', () => switchReaderView('list'));
    $('reciter-back-button').addEventListener('click', () => switchReciterView('list'));

    downloadAllBtn.addEventListener('click', bulkDownloadSurahs);
    
    cancelDownloadBtn.addEventListener('click', () => {
        activeBulkDownload = false;
        downloadModal.style.display = 'none';
        showToast(getTranslation('cancel'), 'info');
    });

    brandLogo.addEventListener('click', () => {
        switchTab('tab-reader');
        switchReaderView('list');
        searchInput.value = '';
    });
    brandLogo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') brandLogo.click();
    });
}

// ==========================================
// BOOT
// ==========================================
init();
