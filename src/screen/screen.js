class Screen {
    age = 0;
    commands = [];
    songVolume = 1;

    constructor() {
        if (DEBUG) {
            this.debugValues = () => ([]);
        }
    }

    addCommand(label, detect, action, playSound = true) {
        this.commands.push({ label, detect, action, playSound });
        return this;
    }

    // 键盘与触摸两套提示文案，触摸端只展示图标与中文标签
    addCommandWithHints(keyboardLabel, touchHint, detect, action, playSound = true) {
        this.commands.push({
            label: inputMode == INPUT_MODE_TOUCH ? '' : keyboardLabel,
            touchHint: inputMode == INPUT_MODE_TOUCH ? touchHint : null,
            detect,
            action,
            playSound,
        });
        return this;
    }

    addDifficultyCycleCommands() {
        const cycleDifficulty = () => {
            const currentIndex = DIFFICULTIES.indexOf(G.difficulty);
            if (currentIndex >= 0) G.difficulty = DIFFICULTIES[(currentIndex + 1) % DIFFICULTIES.length];
        };

        // 键盘按住轮询，触摸端点一次虚拟按键只切换一次
        this.addCommandWithHints(
            '按 [K] 切换难度',
            { icon: 'settings', text: '切换难度' },
            () => (inputMode == INPUT_MODE_KEYBOARD
                ? held(KEY_DIFFICULTY)
                : pressed(KEY_DIFFICULTY)),
            cycleDifficulty,
        );
    }

    addMainMenuCommands() {
        this.addCommandWithHints(
            '按 [M] 返回主菜单',
            { icon: 'arrow-left', text: '返回主菜单' },
            () => (inputMode == INPUT_MODE_KEYBOARD
                ? held(KEY_MENU)
                : pressed(KEY_MENU)),
            () => G.startNavigation(),
        );
    }

    pop() {
        const index = G.screens.indexOf(this);
        if (index >= 0) G.screens.splice(index, 9);
    }

    resolve() {
        const { resolvers } = this;
        if (!resolvers) return;
        this.resolvers = null;
        this.pop();
        resolvers.resolve();
    }

    reject(popScreen) {
        const { resolvers } = this;
        if (!resolvers) return;
        this.resolvers = null;
        if (popScreen) this.pop();
        resolvers.reject();
    }

    awaitCompletion() {
        this.completion = new Promise((resolve, reject) => {
            this.resolvers = {
                resolve: () => {
                    this.completion.__state = 'resolved';
                    resolve();
                },
                reject: (error) => {
                    this.completion.__state = 'rejected';
                    reject(error);
                },
            };
        });
        this.completion.__state = 'pending';
        return this.completion;
    }

    // 是否显示游戏内 HUD：只有最上层界面是游戏界面时才绘制
    get showsHud() {
        return false;
    }

    cycle(elapsed) {
        this.age += elapsed;

        if (!TOUCH_DOWN) {
            let keyboardIdle = true;
            for (const key in downKeys) {
                if (downKeys[key]) keyboardIdle = false;
            }
            if (keyboardIdle) this.releasedCommand = true;
        }

        if (this.releasedCommand && this.isForeground()) {
            const command = this.commands.find(({ detect }) => detect?.());
            if (command) {
                if (command.playSound) {
                    zzfx(...[.5,,500,,.02,.14,,3.2,,,325,.05,.03,,,,,.79,.04,,-1129]);
                    vibrate(10);
                }
                this.releasedCommand = false;
                command.action();
            }
        }

        if (this.isForeground()) {
            setSongLevel(this.songVolume * (document.hasFocus() ? 1 : 0));
        }
    }

    renderCommandHints(baseY) {
        const hints = this.commands.filter(command => command.touchHint);
        if (!hints.length) return;

        const spacing = 78;
        let y = baseY - ((hints.length - 1) * spacing) / 2;

        for (const command of hints) {
            ctx.wrap(() => {
                ctx.globalAlpha = this.age % 2 < 1.5 || !command.detect ? 1 : 0.45;
                renderTouchHint(command.touchHint, DESIGN_WIDTH / 2 - 130, y, 62);
            });
            y += spacing;
        }
    }

    renderKeyboardCommands(baseY) {
        const labels = this.commands.filter(command => command.label);
        if (!labels.length) return;

        let y = baseY - ((labels.length - 1) * COMMAND_SPACING) / 2;

        for (const { label, detect } of labels) {
            if (this.age % 2 < 1.5 || !detect) {
                ctx.wrap(() => this.renderCommandText(typeof label === 'function' ? label() : label, y));
            }
            y += COMMAND_SPACING;
        }
    }

    renderCommandText(line, y) {
        ctx.globalAlpha = 1;
        ctx.font = uiFont(34);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.textBaseline = nomangle('middle');
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.textAlign = nomangle('center');

        ctx.strokeText(line, DESIGN_WIDTH / 2, y);
        ctx.fillText(line, DESIGN_WIDTH / 2, y);
    }

    render() {

    }

    isForeground() {
        return G?.screens?.[G.screens.length - 1] === this;
    }
}

class TransitionScreen extends Screen {

    constructor(from, to) {
        super();
        this.from = from;
        this.to = to;
    }

    get progress() {
        return this.age / 0.2;
    }

    cycle(elapsed) {
        super.cycle(elapsed);
        if (this.progress >= 1) {
            this.resolve();
        }
    }

    render() {
        ctx.translate(interpolate(this.from, this.to, this.progress) * (DESIGN_WIDTH + 200), 0);

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.fillRect(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 20, 20);
        ctx.moveTo(0, 0);
        ctx.lineTo(DESIGN_WIDTH + 200, 0);
        ctx.lineTo(DESIGN_WIDTH, DESIGN_HEIGHT);
        ctx.lineTo(-200, DESIGN_HEIGHT);
        ctx.fill();
    }
}
