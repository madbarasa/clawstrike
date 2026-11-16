// 虚拟按键布局：全部使用设计基准坐标，命中判定与绘制共用同一套换算
// 图标统一取自图标库，方向键直接使用箭头图标，其余按键附带中文标签
VIRTUAL_KEY_LAYOUT = [
    { id: 'left', key: KEY_LEFT, x: 300, y: 700, r: 92, icon: 'arrow-left' },
    { id: 'right', key: KEY_RIGHT, x: 560, y: 700, r: 92, icon: 'arrow-right' },
    { id: 'meow', key: KEY_MEOW, x: 1020, y: 690, r: 68, icon: 'cat', label: '喵叫' },
    { id: 'attack', key: KEY_ATTACK, x: 1230, y: 730, r: 76, icon: 'claw', label: '攻击' },
    { id: 'jump', key: KEY_UP, x: 1455, y: 690, r: 92, icon: 'arrow-up', label: '跳跃' },
    { id: 'roll', key: KEY_DOWN, x: 1240, y: 470, r: 62, icon: 'roll', label: '翻滚' },
];

// 系统界面按钮：左上返回、右上设置、顶中暂停
uiButtons = () => ({
    back: { x: 24, y: 22, w: 78, h: 78 },
    settings: { x: DESIGN_WIDTH - 102, y: 22, w: 78, h: 78 },
    pause: { x: DESIGN_WIDTH / 2 - 39, y: 22, w: 78, h: 78 },
});

pointInRect = (x, y, rect) => x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;

activeTouches = {};
touchHandlerAttached = false;

attachTouchHandlers = () => {
    if (touchHandlerAttached) return;
    touchHandlerAttached = true;

    window.addEventListener('touchstart', onTouchEvent, { passive: false });
    window.addEventListener('touchmove', onTouchEvent, { passive: false });
    window.addEventListener('touchend', onTouchEvent, { passive: false });
    window.addEventListener('touchcancel', onTouchEvent, { passive: false });

    window.addEventListener('mousedown', onPointerEvent);
    window.addEventListener('mousemove', onPointerEvent);
    window.addEventListener('mouseup', onPointerEvent);

    window.addEventListener('blur', () => {
        activeTouches = {};
        touchKeys = {};
        TOUCH_DOWN = false;
    });
};

// 客户端坐标换算到设计基准坐标
convertToDesign = (clientX, clientY) => {
    const rect = can.getBoundingClientRect();
    // 画布按设计比例绘制，外层容器可能保留少量留白，命中判定要与绘制一致
    const drawnWidth = min(rect.width, rect.height * DESIGN_WIDTH / DESIGN_HEIGHT);
    const drawnHeight = drawnWidth * DESIGN_HEIGHT / DESIGN_WIDTH;
    const offsetX = (rect.width - drawnWidth) / 2;
    const offsetY = (rect.height - drawnHeight) / 2;

    return {
        x: (clientX - rect.left - offsetX) / drawnWidth * DESIGN_WIDTH,
        y: (clientY - rect.top - offsetY) / drawnHeight * DESIGN_HEIGHT,
    };
};

findVirtualKey = (x, y) => {
    for (const key of VIRTUAL_KEY_LAYOUT) {
        // 判定范围略大于可见按键，手感更宽容
        if (pointDistance(x, y, key.x, key.y) < key.r * 1.35) return key;
    }
    return null;
};

findUiButton = (x, y) => {
    const buttons = uiButtons();
    for (const name in buttons) {
        if (pointInRect(x, y, buttons[name])) return name;
    }
    return null;
};

resolveTouchTarget = (position) => {
    const uiButton = findUiButton(position.x, position.y);
    if (uiButton) return { ui: uiButton };

    const key = findVirtualKey(position.x, position.y);
    if (key) return { key: key.key, id: key.id };

    return {};
};

onTouchEvent = (evt) => {
    inputMode = INPUT_MODE_TOUCH;
    evt.preventDefault();

    const nextTouches = {};
    for (const touch of evt.touches) {
        const position = convertToDesign(touch.clientX, touch.clientY);
        const existing = activeTouches[touch.identifier];

        nextTouches[touch.identifier] = {
            ...position,
            ...(existing || resolveTouchTarget(position)),
        };
    }

    const previous = activeTouches;
    activeTouches = nextTouches;

    // 按住后滑动可以切换方向键
    for (const id in activeTouches) {
        const touch = activeTouches[id];
        if (touch.ui) continue;

        const key = findVirtualKey(touch.x, touch.y);
        touch.key = key ? key.key : undefined;
        touch.id = key ? key.id : undefined;
    }

    refreshTouchKeys();
    notifyTouchBegan(previous);
    notifyUiTapped(previous);
};

onPointerEvent = (evt) => {
    if (evt.target !== can) return;

    if (evt.type === 'mousedown') {
        const position = convertToDesign(evt.clientX, evt.clientY);
        const previous = activeTouches;

        activeTouches = { mouse: { ...position, ...resolveTouchTarget(position) } };

        refreshTouchKeys();
        notifyTouchBegan(previous);
        notifyUiTapped(previous);
    } else if (evt.type === 'mousemove' && activeTouches.mouse) {
        const position = convertToDesign(evt.clientX, evt.clientY);
        const touch = activeTouches.mouse;
        touch.x = position.x;
        touch.y = position.y;

        if (!touch.ui) {
            const key = findVirtualKey(position.x, position.y);
            touch.key = key ? key.key : undefined;
            touch.id = key ? key.id : undefined;
        }

        refreshTouchKeys();
    } else if (evt.type === 'mouseup' && activeTouches.mouse) {
        activeTouches = {};
        refreshTouchKeys();
    }
};

refreshTouchKeys = () => {
    touchKeys = {};
    let count = 0;
    for (const id in activeTouches) {
        count++;
        const { key } = activeTouches[id];
        if (key !== undefined) touchKeys[key] = true;
    }
    TOUCH_DOWN = count > 0;
};

// 新按下的触点：命中虚拟按键记一次按下脉冲，空白处记一次“轻触”
notifyTouchBegan = (previousTouches) => {
    for (const id in activeTouches) {
        if (previousTouches[id]) continue;

        const touch = activeTouches[id];
        if (touch.key !== undefined) {
            virtualKeyPulses[touch.key] = true;
        } else if (!touch.ui) {
            TOUCH_TAPPED = true;
        }
    }
};

// 界面按钮：按下的瞬间派发给当前前台界面处理
notifyUiTapped = (previousTouches) => {
    for (const id in activeTouches) {
        if (previousTouches[id]) continue;

        const touch = activeTouches[id];
        if (!touch.ui) continue;

        G?.screens?.[G.screens.length - 1]?.onUiTap?.(touch.ui);
    }
};
