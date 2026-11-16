class Game {

    bestRunTime = Storage.get('clawstrike-best-time', 0) || 0;
    difficulty = inputMode == INPUT_MODE_TOUCH ? DIFFICULTY_EASY : DIFFICULTY_NORMAL;

    // 固定时间步长：逻辑始终以 120Hz 推进，与刷新率解耦
    alpha = 1;
    accumulator = 0;

    constructor() {
        // 实例自身持有状态，避免依赖类字段在原型上的共享语义
        this.screens = [];
        this.runTime = 0;
        this.runLevelIndex = 0;
        this.runDeaths = 0;

        if (DEBUG) {
            this.lastFrameIndex = 0;
            this.frameTimes = Array(60).fill(0);

            const params = new URLSearchParams(location.search);
            if (params.get('level')) {
                ALL_LEVELS = [JSON.parse(params.get('level'))];
            }
        }

        loadUiIcons();
        attachTouchHandlers();

        this.frame();
    }

    boot() {
        startGame();

        if (DEBUG && window.__steps) {
            runAutomation(window.__steps);
        }
    }

    // 调试构建暴露的界面跳转入口，供自动化截图使用
    debugOpen(name) {
        if (!DEBUG) return;

        if (name == 'settings') this.navigate(new SettingsScreen());
        if (name == 'credits') this.navigate(new CreditsScreen());
        if (name == 'pause') this.screens[this.screens.length - 1].openPause?.();
    }

    async startNavigation() {
        let promptedEasyMode;

        while (true) {
            this.runTime = this.runLevelIndex = this.runDeaths = 0;

            const currentIndex = DIFFICULTIES.indexOf(this.difficulty);
            if (currentIndex < 0) this.difficulty = DIFFICULTY_NORMAL;

            for (let level = 0 ; level < ALL_LEVELS.length; level++) {
                this.runLevelIndex = level;

                for (let attempt = 0; ; attempt++) {
                    try {
                        const gameplay = this.navigate(new GameplayScreen(ALL_LEVELS[level]), true);
                        if (!attempt && !level) this.navigate(new MainMenuScreen(gameplay));

                        await this.navigate(new TransitionScreen(0, -1)).awaitCompletion();

                        await gameplay.awaitCompletion();

                        break;
                    } catch (err) {
                        this.runDeaths++;

                        if (this.runDeaths < this.difficulty.maxDeaths) {
                            await this.navigate(new GameOverScreen()).awaitCompletion();

                            if (this.difficulty == DIFFICULTY_NORMAL && attempt >= 5 && !promptedEasyMode) {
                                if (await this.navigate(new ConfirmScreen('切换为简单模式？')).awaitCompletion()) {
                                    this.difficulty = DIFFICULTY_EASY;
                                }
                                promptedEasyMode = true;
                                this.screens = [];
                            }

                            this.screens = [];
                        } else {
                            await this.navigate(new FullGameOverScreen()).awaitCompletion();
                            await this.startNavigation();
                        }
                    }

                    await this.navigate(new TransitionScreen(1, 0)).awaitCompletion();
                }
            }

            this.bestRunTime = min(this.bestRunTime || 9999, this.runTime);
            Storage.set('clawstrike-best-time', this.bestRunTime);

            const blankScreen = this.navigate(new WorldScreen([]));
            await this.navigate(new RevengeScreen()).awaitCompletion();
            await this.navigate(new GameCompleteScreen(blankScreen)).awaitCompletion();
        }
    }

    frame() {
        const now = performance.now();
        const frameTime = min((now - (this.lastFrame || now)) / 1000, MAX_FRAME_TIME);
        this.lastFrame = now;

        try {
            this.tick(now, frameTime);
        } catch (error) {
            showFatalError('运行异常', error);
            throw error;
        }

        // 虚拟按键的按下脉冲与轻触标记每帧清空一次
        resetFrameInput();

        requestAnimationFrame(() => this.frame());
    }

    tick(now, frameTime) {
        ctx.miterLimit = 2;

        if (DEBUG && !document.hasFocus()) return;

        let scaledFrameTime = frameTime;
        if (DEBUG) {
            if (downKeys[71]) scaledFrameTime *= 0.1;
            if (downKeys[70]) scaledFrameTime *= 4;
        }

        this.accumulator += scaledFrameTime;

        let steps = 0;
        while (this.accumulator >= FIXED_TIME_STEP && steps < MAX_STEPS_PER_FRAME) {
            this.update(FIXED_TIME_STEP);
            this.accumulator -= FIXED_TIME_STEP;
            steps++;
        }

        // 掉帧过多时丢弃堆积，避免连锁追赶带来更严重的卡顿
        if (steps >= MAX_STEPS_PER_FRAME) {
            this.accumulator = 0;
        }

        this.alpha = between(0, this.accumulator / FIXED_TIME_STEP, 1);

        this.render();

        if (DEBUG) {
            // 调试构建把界面栈与输入状态暴露给自动化检查
            window.__screens = this.screens.map(screen => screen.constructor.name);
            window.__touch = inputMode == INPUT_MODE_TOUCH;
            window.__fatal = fatalError ? fatalError.title + ': ' + String(fatalError.message).split('\n')[0] : '';
        }

        if (DEBUG && DEBUG_INFO) ctx.wrap(() => this.renderDebugInfo(now));
    }

    update(elapsed) {
        let i = this.screens.length;
        while (this.screens[--i]) {
            const screen = this.screens[i];
            screen.cycle(elapsed);
            if (screen.absorb) break;
        }
    }

    render() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        for (const screen of this.screens) {
            ctx.wrap(() => screen.render());
        }

        if (fatalError) renderFatalError(fatalError);
    }

    renderDebugInfo(now) {
        this.frameTimes[this.lastFrameIndex] = now;
        const nextIndex = (this.lastFrameIndex + 1) % this.frameTimes.length;
        const fps = (this.frameTimes.length - 1) / ((now - this.frameTimes[nextIndex]) / 1000);
        this.lastFrameIndex = nextIndex;

        ctx.translate(10, 10);
        ctx.font = '20px Courier';
        ctx.textAlign = nomangle('left');
        ctx.textBaseline = nomangle('middle');
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#000';
        ctx.shadowOffsetY = 2;

        const debugValues = [`FPS: ${fps.toFixed(1)}`];

        for (const screen of this.screens) {
            debugValues.push(...screen.debugValues());
        }

        for (const value of debugValues) {
            ctx.fillText(value, 0, 0);
            ctx.translate(0, 20);
        }
    }

    navigate(screen, reset) {
        if (reset) this.screens = [];
        this.screens.push(screen);
        return screen;
    }
}

// 启动引导：开场动画结束后进入正式流程
startGame = () => {
    const intro = G.navigate(new IntroScreen());

    const advance = () => {
        Promise.resolve(G.startNavigation()).catch(error => {
            showFatalError('流程中断', error);
        });
    };

    intro.awaitCompletion().then(advance, advance);
};

// 调试构建用的自动化驱动：按步骤推进输入并跳转界面
runAutomation = (steps) => {
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve));

    const applyStep = async (step) => {
        if (step.wait) {
            for (let i = 0; i < step.wait; i++) await frame();
        }

        if (step.tap) {
            TOUCH_TAPPED = true;
            await frame();
        }

        if (step.keys) {
            for (const code of step.keys) downKeys[code] = true;
            for (let i = 0; i < (step.hold || 2); i++) await frame();
            for (const code of step.keys) downKeys[code] = false;
        }

        if (step.touchKey) {
            virtualKeyPulses[step.touchKey] = true;
            touchKeys[step.touchKey] = true;
            for (let i = 0; i < (step.hold || 2); i++) await frame();
            touchKeys[step.touchKey] = false;
        }

        if (step.openSettings) {
            G.debugOpen('settings');
            await frame();
        }

        if (step.openCredits) {
            G.debugOpen('credits');
            await frame();
        }

        if (step.openPause) {
            G.debugOpen('pause');
            await frame();
        }    };

    Promise.resolve().then(async () => {
        for (const step of steps) {
            await applyStep(step);
        }
    });
};

// 运行期异常直接显示在画面上，避免停在黑屏
showFatalError = (title, error) => {
    const message = String(error && error.stack || error);
    window.__fatalSeen = title + ' | ' + message.split('\n')[0];
    globalThis.__fatalSeen = window.__fatalSeen;

    fatalError ||= { title, message };
};

fatalError = null;
