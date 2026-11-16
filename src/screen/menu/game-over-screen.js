class GameOverScreen extends MenuScreen {

    title = G.difficulty.maxDeaths < Infinity
        ? '剩余 ' + (G.difficulty.maxDeaths - G.runDeaths) + ' 条命'
        : '猫生惨剧';

    constructor() {
        super();

        this.addCommandWithHints(
            '按 [R] 再来一次',
            { icon: 'roll', text: '轻触屏幕再来一次' },
            () => (inputMode == INPUT_MODE_KEYBOARD
                ? held(KEY_RETRY)
                : pressed(KEY_RETRY) || pressed(KEY_ATTACK) || TOUCH_TAPPED),
            () => this.resolve(),
        );

        if (inputMode == INPUT_MODE_KEYBOARD) {
            if (G.difficulty.maxDeaths == Infinity) {
                this.addDifficultyCycleCommands();
            }
            this.addMainMenuCommands();
        }

        this.onUiTap = (button) => {
            if (button === 'settings') G.navigate(new SettingsScreen());
        };
    }

    render() {
        super.render();

        ctx.wrap(() => {
            ctx.globalAlpha = 1;
            renderTopBar(false);
        });
    }
}

class FullGameOverScreen extends MenuScreen {

    title = '九条命已用尽';

    constructor() {
        super();

        this.addCommandWithHints(
            '按 [空格] 返回主菜单',
            { icon: 'arrow-left', text: '轻触屏幕返回主菜单' },
            () => (inputMode == INPUT_MODE_KEYBOARD
                ? held(KEY_ATTACK)
                : pressed(KEY_ATTACK) || TOUCH_TAPPED),
            () => this.resolve(),
        );

        this.onUiTap = (button) => {
            if (button === 'settings') G.navigate(new SettingsScreen());
        };
    }

    render() {
        super.render();

        ctx.wrap(() => {
            ctx.globalAlpha = 1;
            renderTopBar(false);
        });
    }
}
