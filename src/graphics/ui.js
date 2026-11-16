UI_FONT_FAMILY = '"微软雅黑", "PingFang SC", "Microsoft YaHei", sans-serif';

uiFont = (size, weight = 'bold') => `${weight} ${round(size)}px ${UI_FONT_FAMILY}`;

// 小纹理：为所有面板提供统一的颗粒质感
UI_NOISE = (() => {
    const size = 96;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;

    const noiseCtx = canvas.getContext('2d');
    const image = noiseCtx.createImageData(size, size);
    for (let i = 0; i < image.data.length; i += 4) {
        const value = ~~(random() * 255);
        image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
        image.data[i + 3] = 255;
    }
    noiseCtx.putImageData(image, 0, 0);

    return canvas.getContext('2d').createPattern(canvas, 'repeat');
})();

roundedRectPath = (x, y, width, height, radius) => {
    const r = min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
};

// 图标全部取自图标库 PNG，颜色与旋转提前烘焙，逐帧只做一次 drawImage
UI_ICONS = {};

loadUiIcons = () => {
    const sources = {
        'arrow-left': 'assets/UI/icons/arrow-left.png',
        'arrow-right': 'assets/UI/icons/arrow-right.png',
        'arrow-up': 'assets/UI/icons/arrow-up.png',
        'arrow-down': 'assets/UI/icons/arrow-down.png',
        play: 'assets/UI/icons/play.png',
        roll: 'assets/UI/icons/refresh.png',
        cat: 'assets/UI/icons/cat.png',
        claw: 'assets/UI/icons/sword.png',
        settings: 'assets/UI/icons/adjustment.png',
        volume: 'assets/UI/icons/volume.png',
        info: 'assets/UI/icons/info.png',
        back: 'assets/UI/icons/arrow-left.png',
        check: 'assets/UI/icons/tick.png',
        group: 'assets/UI/icons/character.png',
        rank: 'assets/UI/icons/ranking.png',
        pause: 'assets/UI/icons/pause.png',
        vibrate: 'assets/UI/icons/lightning.png',
    };

    for (const name in sources) {
        const image = new Image();
        image.src = sources[name];
        image.onload = () => { UI_ICONS[name] = image; };
        image.onerror = () => { UI_ICON_ERRORS.push(sources[name]); };
    }
};

UI_ICON_ERRORS = [];

iconCache = {};

renderIcon = (name, x, y, size, color, rotation = 0) => {
    if (!UI_ICONS[name]) return;

    const roundedSize = round(size);
    ctx.drawImage(
        bakedIcon(name, color, rotation),
        round(x - roundedSize / 2),
        round(y - roundedSize / 2),
        roundedSize,
        roundedSize,
    );
};

bakedIcon = (name, color, rotation) => {
    const key = name + '|' + color + '|' + round(rotation * 100);
    if (iconCache[key]) return iconCache[key];

    const resolution = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = resolution;

    const iconCtx = canvas.getContext('2d');
    iconCtx.translate(resolution / 2, resolution / 2);
    if (rotation) iconCtx.rotate(rotation);
    iconCtx.drawImage(UI_ICONS[name], -resolution / 2, -resolution / 2, resolution, resolution);

    iconCtx.setTransform(1, 0, 0, 1, 0, 0);
    iconCtx.globalCompositeOperation = 'source-in';
    iconCtx.fillStyle = color;
    iconCtx.fillRect(0, 0, resolution, resolution);

    iconCache[key] = canvas;
    return canvas;
};

iconRotation = (icon) => 0;

// 虚拟按键：大尺寸触摸目标，渐变底色、小纹理与按下反馈
renderVirtualKeys = () => {
    for (const key of VIRTUAL_KEY_LAYOUT) {
        const pressedState = held(key.key);
        const radius = key.r;

        ctx.wrap(() => {
            ctx.translate(key.x, key.y);

            if (pressedState) ctx.translate(0, 5);

            ctx.wrap(() => {
                ctx.shadowColor = pressedState ? 'rgba(255,60,80,0.8)' : 'rgba(0,0,0,0.6)';
                ctx.shadowBlur = pressedState ? 34 : 16;
                ctx.shadowOffsetY = 6;

                const gradient = ctx.createLinearGradient(0, -radius, 0, radius);
                if (pressedState) {
                    gradient.addColorStop(0, 'rgba(255,138,146,0.95)');
                    gradient.addColorStop(1, 'rgba(150,22,42,0.95)');
                } else {
                    gradient.addColorStop(0, 'rgba(118,132,168,0.62)');
                    gradient.addColorStop(1, 'rgba(20,26,40,0.78)');
                }

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, TWO_PI);
                ctx.fill();
            });

            ctx.wrap(() => {
                const highlight = ctx.createLinearGradient(0, -radius, 0, radius * 0.2);
                highlight.addColorStop(0, 'rgba(255,255,255,0.3)');
                highlight.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = highlight;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, TWO_PI);
                ctx.fill();

                ctx.globalAlpha = 0.09;
                ctx.fillStyle = UI_NOISE;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, TWO_PI);
                ctx.fill();
            });

            ctx.wrap(() => {
                ctx.globalAlpha = 0.55;
                ctx.strokeStyle = pressedState ? '#fff' : 'rgba(255,255,255,0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, radius - 3, 0, TWO_PI);
                ctx.stroke();
            });

            ctx.wrap(() => {
                if (key.icon) {
                    renderIcon(
                        key.icon,
                        0,
                        0,
                        radius * 0.95,
                        pressedState ? '#fff' : 'rgba(255,255,255,0.94)',
                        iconRotation(key.icon),
                    );
                }

                // 图标缺失或方向键无图标时，用中文标签保证按键可识别
                if (!key.icon || key.label) {
                    ctx.textAlign = nomangle('center');
                    ctx.textBaseline = nomangle('middle');
                    ctx.font = uiFont(radius * (key.labelOnly ? 0.5 : 0.34));
                    ctx.fillStyle = '#fff';
                    ctx.fillText(key.label, 0, key.icon ? radius * 0.52 : 0);
                }
            });
        });
    }
};
