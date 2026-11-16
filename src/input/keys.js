// 统一的按键状态：键盘事件与虚拟按键都写入同一份状态
KEY_LEFT = 37;
KEY_UP = 38;
KEY_RIGHT = 39;
KEY_DOWN = 40;
KEY_ATTACK = 32;
KEY_MEOW = 69;
KEY_ESC = 27;
KEY_ENTER = 13;
KEY_RETRY = 82;
KEY_DIFFICULTY = 75;
KEY_MENU = 77;
KEY_NINE_LIVES = 57;
KEY_PAUSE = 80;

downKeys = {};
touchKeys = {};
virtualKeyPulses = {};
TOUCH_DOWN = false;
TOUCH_TAPPED = false;

held = (key) => !!downKeys[key] || !!touchKeys[key];
pressed = (key) => !!virtualKeyPulses[key] || !!TOUCH_TAPPED;

// 每帧清零一次瞬时输入，保证一次触摸只响应一次
resetFrameInput = () => {
    virtualKeyPulses = {};
    TOUCH_TAPPED = false;
};
