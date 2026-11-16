class MainMenuScreen extends MenuScreen {

    title = 'CLAWSTRIKE';

    constructor(worldScreen) {
        super();

        this.worldScreen = worldScreen;

        // 键盘按下即时响应，触摸端轻触屏幕任意位置开始
        this.addCommandWithHints(
            '按 [空格] 开始',
            { icon: 'play', text: '轻触屏幕开始' },
            () => (inputMode == INPUT_MODE_KEYBOARD
                ? held(KEY_ATTACK)
                : pressed(KEY_ATTACK) || TOUCH_TAPPED),
            () => this.startGame(),
        );

        if (G.bestRunTime) {
            this.addCommand(
                '按 [9] 进入九命模式',
                () => (inputMode == INPUT_MODE_KEYBOARD
                    ? held(KEY_NINE_LIVES)
                    : pressed(KEY_NINE_LIVES)),
                () => {
                    G.difficulty = DIFFICULTY_NINE_LIVES;
                    this.startGame();
                },
            );
        }

        if (inputMode == INPUT_MODE_KEYBOARD) {
            this.addDifficultyCycleCommands();
        }

        if (DEBUG) {
            this.addCommand(
                '按 [E] 进入关卡编辑器',
                () => downKeys[69],
                () => G.navigate(new LevelEditorScreen(ALL_LEVELS[0]), true),
            );
        }

        const { world } = worldScreen;

        const cat = firstItem(worldScreen.world.category('cat'));
        const camera = firstItem(worldScreen.world.category('camera'));
        camera.zoom = 3;
        camera.previousZoom = 3;
        camera.target = new Entity();
        camera.x = camera.target.x = cat.x;
        camera.y = camera.target.y = cat.y - 20;

        for (const hud of world.category('hud')) {
            world.removeEntity(hud);
        }

        worldScreen.cycle(2);

        this.onUiTap = (button) => {
            if (button === 'settings') this.openSettings();
        };

        (async () => {
            const flash = world.addEntity(new Flash('#000'));

            await flash.interp('', 0, 0, 0.3);

            for (const angle of [PI / 8, PI * 3 / 4, PI / 4]) {
                camera.shake(0.1, 5);

                const claw = world.addEntity(new ClawEffect());
                claw.x = camera.target.x;
                claw.y = camera.target.y;
                claw.angle = angle;
                claw.scale = 5;

                await flash.interp('_', 0, 0, 0.3);
            }

            await flash.interp('_', 0, 0, 0.5);
            await flash.interp('alpha', 1, 0, 1);
        })();
    }

    async openSettings() {
        await G.navigate(new SettingsScreen()).awaitCompletion();
    }

    startGame() {
        G.screens.pop();

        playSong();
        vibrate(15);

        const { world } = this.worldScreen;
        const cat = firstItem(world.category('cat'));
        const camera = firstItem(world.category('camera'));
        camera.target = cat;

        (async () => {
            await camera.interp('zoom', camera.zoom, 1.3, 2, easeInQuad);
            world.addEntity(new HUD(cat));
        })();

        G.runTime = 0;
    }

    renderTitle() {
        ctx.wrap(() => {
            this.claw ||= (() => {
                const claw = new ClawEffect();
                claw.x = DESIGN_WIDTH / 2;
                claw.y = DESIGN_HEIGHT / 3 - 20;
                claw.age = 0.5;
                claw.angle = -PI / 6;
                claw.scale = 12;
                claw.color = '#f00';
                return claw;
            })();
            this.claw.render();
        });

        super.renderTitle();
    }

    render() {
        ctx.globalAlpha = interpolate(0, 1, min(this.age - 2.1, 1) / 0.3);
        super.render();

        ctx.wrap(() => {
            ctx.globalAlpha = 1;
            renderTopBar(false);
            renderVersionFooter();
        });
    }
}
