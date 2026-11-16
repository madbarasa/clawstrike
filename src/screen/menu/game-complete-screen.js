class GameCompleteScreen extends MenuScreen {

    title = '通关';

    constructor(worldScreen) {
        super();

        this.worldScreen = worldScreen;

        this.stats = [
            ['难度', G.difficulty.label],
            ['阵亡次数', G.runDeaths + ''],
            ['用时', formatTime(G.runTime)],
            ['最佳用时', formatTime(G.bestRunTime)],
        ];

        this.addCommandWithHints(
            '按 [空格] 关闭',
            { icon: 'check', text: '轻触屏幕关闭' },
            () => (inputMode == INPUT_MODE_KEYBOARD
                ? held(KEY_ATTACK)
                : pressed(KEY_ATTACK) || TOUCH_TAPPED),
            () => this.resolve(),
        );

        const { world } = worldScreen;

        const camera = firstItem(worldScreen.world.category('camera'));
        camera.target = new Entity();
        camera.x = camera.target.x = 999;
        camera.y = camera.target.y = 999;

        for (const hud of world.category('hud')) {
            world.removeEntity(hud);
        }

        (async () => {
            while (true) {
                fireworks(
                    world,
                    {
                        x: camera.x + rnd(-DESIGN_WIDTH / 3, DESIGN_WIDTH / 3),
                        y: camera.y + rnd(-DESIGN_HEIGHT / 4, 0),
                    },
                    50,
                );

                await camera.interp('', 0, 0, rnd(0.25, 0.5));
            }
        })();
    }

    render() {
        ctx.globalAlpha = interpolate(0, 1, min(this.age - 1, 1) / 0.3);

        renderDimOverlay(0.45);

        ctx.wrap(() => {
            ctx.globalAlpha *= 1;
            renderPanelText(this.title, DESIGN_WIDTH / 2, DESIGN_HEIGHT / 3 - 40, 110, { strokeWidth: 16 });
        });

        let y = DESIGN_HEIGHT / 3 + 80;

        for (const [label, value] of this.stats) {
            ctx.wrap(() => {
                renderPanelText(label, DESIGN_WIDTH / 2 - 150, y, 32, { align: 'right', strokeWidth: 5 });
                renderPanelText(value, DESIGN_WIDTH / 2 + 40, y, 32, { align: 'left', strokeWidth: 5 });
            });
            y += 52;
        }

        ctx.wrap(() => {
            renderPanelText('九命模式已解锁', DESIGN_WIDTH / 2, y + 40, 34, {
                color: '#ffd54a',
                strokeWidth: 6,
            });
        });

        ctx.wrap(() => {
            ctx.globalAlpha = 1;
            const labels = this.commands.filter(command => command.label);
            let hintY = DESIGN_HEIGHT - 150;
            for (const { label } of labels) {
                this.renderCommandText(typeof label === 'function' ? label() : label, hintY);
                hintY += COMMAND_SPACING;
            }

            const hints = this.commands.filter(command => command.touchHint);
            if (hints.length) renderTouchHint(hints[0].touchHint, DESIGN_WIDTH / 2 - 120, DESIGN_HEIGHT - 130, 62);
        });
    }
}
