// 触摸界面上的按键提示：图标加中文标签，替代桌面端的按键名
renderTouchHint = (hint, x, y, size) => {
    if (!hint) return;

    ctx.wrap(() => {
        ctx.translate(x, y);

        const gap = size * 0.16;

        if (hint.icon) {
            ctx.wrap(() => {
                ctx.shadowColor = 'rgba(0,0,0,0.7)';
                ctx.shadowBlur = 14;

                const gradient = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
                gradient.addColorStop(0, 'rgba(118,132,168,0.8)');
                gradient.addColorStop(1, 'rgba(20,26,40,0.9)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, size / 2, 0, TWO_PI);
                ctx.fill();
            });

            ctx.wrap(() => {
                ctx.globalAlpha = 0.85;
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, size / 2 - 2, 0, TWO_PI);
                ctx.stroke();
            });

            renderIcon(hint.icon, 0, 0, size * 0.7, '#fff', iconRotation(hint.icon));
            ctx.translate(size / 2 + gap, 0);
        }

        if (hint.text) {
            ctx.textAlign = nomangle('left');
            ctx.textBaseline = nomangle('middle');
            ctx.font = uiFont(size * 0.62);
            ctx.lineJoin = 'round';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.lineWidth = size * 0.16;
            ctx.strokeText(hint.text, 0, 0);
            ctx.fillText(hint.text, 0, 0);
        }
    });
};
