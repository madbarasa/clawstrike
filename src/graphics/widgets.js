// 通用界面控件：顶部按钮、版本页脚、开关行与面板底板
uiButtons = () => ({
    back: { x: 24, y: 22, w: 78, h: 78 },
    settings: { x: DESIGN_WIDTH - 102, y: 22, w: 78, h: 78 },
    pause: { x: DESIGN_WIDTH / 2 - 39, y: 22, w: 78, h: 78 },
});

renderTopBar = (showBack = true) => {
    const buttons = uiButtons();

    if (showBack) {
        renderUiButton(buttons.back, 'arrow-left');
    }

    renderUiButton(buttons.settings, 'settings');
};

renderUiButton = (rect, iconName, options = {}) => {
    const { pressed = false, rotation = 0 } = options;

    ctx.wrap(() => {
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 5;

        const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        gradient.addColorStop(0, pressed ? 'rgba(96,106,132,0.95)' : 'rgba(58,66,84,0.9)');
        gradient.addColorStop(1, pressed ? 'rgba(38,44,60,0.95)' : 'rgba(18,22,32,0.9)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundedRectPath(rect.x, rect.y, rect.w, rect.h, rect.w * 0.3);
        ctx.fill();
    });

    ctx.wrap(() => {
        const highlight = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h * 0.6);
        highlight.addColorStop(0, 'rgba(255,255,255,0.24)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        roundedRectPath(rect.x, rect.y, rect.w, rect.h * 0.6, rect.w * 0.3);
        ctx.fill();

        ctx.globalAlpha = 0.08;
        ctx.fillStyle = UI_NOISE;
        ctx.beginPath();
        roundedRectPath(rect.x, rect.y, rect.w, rect.h, rect.w * 0.3);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = pressed ? '#ff8b90' : 'rgba(255,255,255,0.32)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundedRectPath(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, rect.w * 0.3);
        ctx.stroke();
    });

    renderIcon(iconName, rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.6, '#fff', rotation);
};

renderVersionFooter = () => {
    ctx.wrap(() => {
        ctx.textAlign = nomangle('left');
        ctx.textBaseline = nomangle('bottom');
        ctx.font = uiFont(20, 'normal');
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        ctx.fillText(VERSION, 28, DESIGN_HEIGHT - 22);
    });

    ctx.wrap(() => {
        ctx.textAlign = nomangle('center');
        ctx.textBaseline = nomangle('bottom');
        ctx.font = uiFont(20, 'normal');
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText('基于 UrhoX 引擎开发', DESIGN_WIDTH / 2, DESIGN_HEIGHT - 22);
    });
};

renderPanelText = (text, x, y, size, options = {}) => {
    const {
        align = 'center',
        baseline = 'middle',
        color = '#fff',
        weight = 'bold',
        strokeWidth = 6,
    } = options;

    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.font = uiFont(size, weight);
    ctx.fillStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
};

renderDimOverlay = (alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    ctx.globalAlpha = 1;
};

renderSheet = (rect, radius = 28) => {
    ctx.wrap(() => {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 44;
        ctx.shadowOffsetY = 14;

        const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        gradient.addColorStop(0, 'rgba(44,52,70,0.97)');
        gradient.addColorStop(1, 'rgba(16,19,28,0.97)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundedRectPath(rect.x, rect.y, rect.w, rect.h, radius);
        ctx.fill();
    });

    ctx.wrap(() => {
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = UI_NOISE;
        ctx.beginPath();
        roundedRectPath(rect.x, rect.y, rect.w, rect.h, radius);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundedRectPath(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, radius);
        ctx.stroke();
    });
};

// 列表行：左侧图标、中间中文标题、右侧拨杆
renderToggleRow = (rect, iconName, label, enabled) => {
    ctx.wrap(() => {
        const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        gradient.addColorStop(0, enabled ? 'rgba(70,90,102,0.95)' : 'rgba(54,60,76,0.95)');
        gradient.addColorStop(1, enabled ? 'rgba(28,44,50,0.95)' : 'rgba(20,24,34,0.95)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundedRectPath(rect.x, rect.y, rect.w, rect.h, 18);
        ctx.fill();
    });

    ctx.wrap(() => {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = UI_NOISE;
        ctx.beginPath();
        roundedRectPath(rect.x, rect.y, rect.w, rect.h, 18);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.strokeStyle = 'rgba(255,255,255,0.24)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundedRectPath(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, 18);
        ctx.stroke();
    });

    renderIcon(iconName, rect.x + 52, rect.y + rect.h / 2, 48, enabled ? '#fff' : 'rgba(255,255,255,0.65)');

    ctx.wrap(() => {
        ctx.textAlign = nomangle('left');
        ctx.textBaseline = nomangle('middle');
        ctx.font = uiFont(28);
        ctx.fillStyle = enabled ? '#fff' : 'rgba(255,255,255,0.72)';
        ctx.fillText(label, rect.x + 100, rect.y + rect.h / 2);
    });

    const trackWidth = 92;
    const trackHeight = 44;
    const trackX = rect.x + rect.w - trackWidth - 28;
    const trackY = rect.y + (rect.h - trackHeight) / 2;
    const knobX = trackX + (enabled ? trackWidth - trackHeight / 2 : trackHeight / 2);
    const knobY = trackY + trackHeight / 2;

    ctx.wrap(() => {
        const gradient = ctx.createLinearGradient(trackX, trackY, trackX, trackY + trackHeight);
        gradient.addColorStop(0, enabled ? '#57d68b' : 'rgba(120,128,150,0.7)');
        gradient.addColorStop(1, enabled ? '#2c9c60' : 'rgba(64,70,90,0.75)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        roundedRectPath(trackX, trackY, trackWidth, trackHeight, trackHeight / 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.arc(knobX, knobY, trackHeight / 2 - 5, 0, TWO_PI);
        ctx.fill();
    });
};
