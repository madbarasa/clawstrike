// 触摸端暂停按钮固定在顶部中间，与键盘端的 ESC 等价
pauseButtonRect = () => ({ x: DESIGN_WIDTH / 2 - 39, y: 22, w: 78, h: 78 });

renderPauseButton = () => {
    renderUiButton(pauseButtonRect(), 'pause');
};

class GameplayScreen extends WorldScreen {
    constructor(level) {
        super(level);

        this.addDifficultyCycleCommands();

        this.pauseOpen = false;

        // 键盘端按 ESC 呼出暂停，触摸端点顶部暂停按钮
        this.addCommand('', () => (inputMode == INPUT_MODE_KEYBOARD ? downKeys[27] : pressed(KEY_ESC)), () => this.openPause());

        this.onUiTap = (button) => {
            if (button === 'pause' || button === 'settings') this.openPause();
        };
    }

    openPause() {
        if (this.pauseOpen) return;
        this.pauseOpen = true;

        G.navigate(new PauseScreen()).awaitCompletion().then(() => {
            this.pauseOpen = false;
        });
    }

    cycle(elapsed) {
        const enemyCountBefore = this.world.category('human').size;
        const catCountBefore = this.world.category('cat').size;

        elapsed *= this.timeFactor || 1;

        super.cycle(elapsed);

        if (G && catCountBefore >= 1) G.runTime += elapsed;

        const hud = firstItem(this.world.category('hud'));
        if (hud) hud.alpha = this.isForeground() ? 1 : 0.25;

        if (this.isForeground()) {
            const enemyCountAfter = this.world.category('human').size;
            if (enemyCountBefore && !enemyCountAfter) {
                const camera = firstItem(this.world.category('camera'));

                this.timeFactor = 0.25;

                (async () => {
                    await camera.interp('zoom', camera.zoom, 2, 0.5);
                    this.resolve();
                })();
            }

            if (catCountBefore && !this.world.category('cat').size) {
                this.reject(false);
            }
        }
    }

    render() {
        super.render();

        ctx.wrap(() => {
            ctx.globalAlpha = 1;

            if (inputMode == INPUT_MODE_TOUCH) {
                renderPauseButton();
            }
        });
    }
}