// 全局共享状态：画布、游戏实例与时间步长参数
can = null;
ctx = null;
G = null; // 当前游戏实例

canvasPrototype = CanvasRenderingContext2D.prototype;

CANVAS_WIDTH = 1600;
CANVAS_HEIGHT = 900;
DESIGN_WIDTH = 1600;
DESIGN_HEIGHT = 900;

// 固定步长主循环参数
FIXED_TIME_STEP = 1 / 120;
MAX_FRAME_TIME = 0.25;
MAX_STEPS_PER_FRAME = 12;

inputMode = navigator.userAgent.match(nomangle(/andro|ipho|ipa|ipo/i)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    ? INPUT_MODE_TOUCH
    : INPUT_MODE_KEYBOARD;
