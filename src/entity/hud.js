formatTime = x => {
    return (~~(x / 60)).toString().padStart(2, '0') + ':' + (x % 60).toFixed(2).padStart(5, '0');
};

class HUD extends Entity {

    alpha = 1;
    z = Z_HUD;
    categories = ['hud'];

    constructor(cat) {
        super();
        this.cat = cat;
    }

    cycle(elapsed) {
        super.cycle(elapsed);

        const humanCount = this.world.category('human').size;
        this.maxHumanCount = max(this.maxHumanCount || 0, humanCount);
    }

    // 由世界界面在 HUD 图层调用，绘制坐标已是设计基准
    render() {
        const camera = firstItem(this.world.category('camera'));

        ctx.globalAlpha = this.alpha;

        ctx.wrap(() => {
            if (camera.renderZoom >= 2) return;

            ctx.textAlign = nomangle('left');
            ctx.textBaseline = nomangle('top');

            ctx.translate(30, 26);

            for (const [label, value] of [
                ['关卡', (G.runLevelIndex) + ' / ' + (ALL_LEVELS.length - 1)],
                ['用时', formatTime(G.runTime)],
                ['最佳', formatTime(G.bestRunTime)],
                ['阵亡', G.runDeaths + ''],
                ['难度', G.difficulty.label],
            ]) {
                ctx.font = uiFont(16);
                ctx.fillStyle = 'rgba(120,235,255,0.85)';
                ctx.fillText(label, 0, 0);
                ctx.translate(0, 21);

                ctx.font = uiFont(32);
                ctx.lineJoin = 'round';
                ctx.lineWidth = 6;
                ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                ctx.strokeText(value, 0, 0);
                ctx.fillStyle = '#fff';
                ctx.fillText(value, 0, 0);
                ctx.translate(0, 46);
            }
        });

        if (inputMode == INPUT_MODE_TOUCH) renderVirtualKeys();
    }

    // 世界渲染时会调用 HUD 的绘制，这里直接跳过，由世界界面统一绘制 HUD 图层
    renderBackground() {
    }
}
