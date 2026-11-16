downKeys = {};

ALT_KEYS = {
    // WASD
    65: KEY_LEFT,
    68: KEY_RIGHT,
    87: KEY_UP,
    83: KEY_DOWN,

    // ZQSD
    90: KEY_UP,
    81: KEY_LEFT,
};

document.onkeydown = (evt) => {
    inputMode = INPUT_MODE_KEYBOARD;
    downKeys[ALT_KEYS[evt.keyCode] || evt.keyCode] = true;

    // 避免空格与方向键滚动页面
    if (evt.keyCode in ALT_KEYS || [KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_ATTACK].includes(evt.keyCode)) {
        evt.preventDefault();
    }
};

document.onkeyup = (evt) => downKeys[ALT_KEYS[evt.keyCode] || evt.keyCode] = false;
onblur = () => downKeys = {};
