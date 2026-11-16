DIFFICULTY_NORMAL = {
    maxDeaths: Infinity,
    maxDamageTaken: 1,
    label: '普通',
    humanReactionTime: 0.2,
};

DIFFICULTY_EASY = {
    ...DIFFICULTY_NORMAL,
    maxDamageTaken: 3,
    label: '简单',
    humanReactionTime: 0.5,
};

DIFFICULTY_NINE_LIVES = {
    ...DIFFICULTY_NORMAL,
    maxDeaths: 9,
    label: '九命',
};

DIFFICULTIES = [DIFFICULTY_NORMAL, DIFFICULTY_EASY];

class Storage {

    static get(key, fallback) {
        try {
            const raw = localStorage[key];
            return raw === undefined ? fallback : JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    static set(key, value) {
        localStorage[key] = JSON.stringify(value);
    }
}

SETTINGS = {
    sound: Storage.get('clawstrike-sound', true),
    vibration: Storage.get('clawstrike-vibration', true),
};

saveSettings = () => {
    Storage.set('clawstrike-sound', SETTINGS.sound);
    Storage.set('clawstrike-vibration', SETTINGS.vibration);
};

// 音效与背景音乐总开关，改动立即作用于已播放的音频
setSoundEnabled = (enabled) => {
    SETTINGS.sound = enabled;
    saveSettings();
    zzfxX.resume?.();
    applySoundVolume();
    applySongVolume();
};

// 震感反馈：安卓 Chrome 支持，其余平台静默跳过
vibrate = (pattern) => {
    if (!SETTINGS.vibration) return;
    if (/andro/i.test(navigator.userAgent)) navigator.vibrate?.(pattern);
};