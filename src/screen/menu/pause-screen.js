class PauseScreen extends MenuScreen {

    title = '暂停';
    songVolume = 0.2;
    absorb = true;

    constructor() {
        super();

        // ESC 继续，M 返回主菜单，触摸端可直接点顶部按钮
        this.addCommandWithHints(
            '按 [ESC] 继续游戏',
            { icon: 'play', text: '轻触屏幕继续' },
            () => (inputMode == INPUT_MODE_KEYBOARD
                ? held(KEY_ESC)
                : pressed(KEY_ESC) || pressed(KEY_ATTACK) || TOUCH_TAPPED),
            () => this.resolve(),
        );

        if (inputMode == INPUT_MODE_KEYBOARD) {
            this.addDifficultyCycleCommands();
            this.addMainMenuCommands();
        }

        this.onUiTap = (button) => {
            if (button === 'back') this.resolve();
            if (button === 'settings') this.openSettings();
        };
    }

    async openSettings() {
        await G.navigate(new SettingsScreen()).awaitCompletion();
    }

    render() {
        super.render();

        ctx.wrap(() => {
            ctx.globalAlpha = 1;
            renderTopBar(false);
        });
    }
}
