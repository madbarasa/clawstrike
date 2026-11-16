// 文字按钮：圆角底板 + 可选图标 + 中文标签，图标居左、文字居中
renderTextButton = (rect, label, options = {}) => {
    const { pressed = false, accent = false, icon = null } = options;

    ctx.wrap(() => {
        ctx.shadowColor = accent ? 'rgba(255,60,70,0.55)' : 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = accent ? 26 : 14;
        ctx.shadowOffsetY = 5;

        const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        if (accent) {
            gradient.addColorStop(0, pressed ? '#ffd54a' : '#ff5a5f');
            gradient.addColorStop(1, pressed ? '#e0a000' : '#c21e2e');
        } else {
            gradient.addColorStop(0, pressed ? 'rgba(88,98,122,0.95)' : 'rgba(58,66,84,0.92)');
            gradient.addColorStop(1, pressed ? 'rgba(32,38,52,0.95)' : 'rgba(18,22,32,0.92)');
        }

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

        ctx.strokeStyle = accent ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundedRectPath(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, 18);
        ctx.stroke();
    });

    if (icon) {
        renderIcon(icon, rect.x + 52, rect.y + rect.h / 2, rect.h * 0.52, '#fff');
    }

    ctx.wrap(() => {
        ctx.textAlign = nomangle('center');
        ctx.textBaseline = nomangle('middle');
        ctx.font = uiFont(28);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    });
};
