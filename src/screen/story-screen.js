class StoryScreen extends WorldScreen {
    constructor() {
        super(INTRO_LEVEL);

        const camera = firstItem(this.world.category('camera'));
        camera.x = camera.previousX = CELL_SIZE * 6;
        camera.y = camera.previousY = CELL_SIZE * 2;
        camera.zoom = 3;
        camera.previousZoom = 3;
    }

    async fadeIn() {
        this.cycle(0.2);
        const fadeIn = this.world.addEntity(new Flash('#000'));
        await fadeIn.interp('alpha', 1, 0, 1);
    }

    removeAllEntities() {
        for (const entity of this.world.entities.slice()) {
            if (!(entity instanceof Camera)) this.world.removeEntity(entity);
        }
        this.render();
    }

    async finalize(message) {
        const camera = firstItem(this.world.category('camera'));
        this.removeAllEntities();

        if (inputMode == INPUT_MODE_TOUCH) {
            camera.zoom = camera.previousZoom = 1.3;
        }

        const label = this.world.addEntity(new Label(message));
        label.x = camera.x;
        label.y = camera.y;
        label.visibleStartAge = 0.01;

        await label.interp('_', 0, 0, 2);
        this.resolve();
    }

    cycle(elapsed) {
        super.cycle(elapsed);
        for (const cat of this.world.category('cat')) {
            cat.color = '#fff';
        }
        for (const human of this.world.category('human')) {
            human.color = '#fff';
        }
        for (const structure of this.world.category('structure')) {
            structure.color = '#000';
        }
    }

    makeHarmless(human) {
        human.seesCat = null;
        human.lastSeenCat = -9;
        human.walking = false;
        human.facing = human.walkingDirection = 1;
        human.lastDamage = human.age - 0.2;
        human.aim = PI / 2 + PI / 8;
        human.lastDamage = this.enemy.age - 0.2;
    }
}

class IntroScreen extends StoryScreen {
    constructor() {
        super();

        this.owner = this.world.addEntity(new Human());
        this.owner.x = CELL_SIZE * 4;

        this.enemy = this.world.addEntity(new Human());
        this.enemy.x = CELL_SIZE * 8;

        this.owner.color = this.enemy.color = '#fff';
        this.owner.y = this.enemy.y = CELL_SIZE * 2;
        this.owner.health = 1;

        this.addCommandWithHints(
            '按 [回车] 跳过',
            { icon: 'play', text: '轻触跳过' },
            () => held(KEY_ENTER) || TOUCH_TAPPED,
            () => this.resolve(),
        );

        (async () => {
            await this.fadeIn();

            // 朝主人开一枪，等待主人受伤
            this.enemy.shoot();
            while (this.owner.health) await this.enemy.interp('_', 0, 0, 0);

            this.removeAllEntities();

            await this.world.addEntity(new Flash('#fff')).interp('alpha', 1, 0, 2);

            await this.finalize('为你的铲屎官复仇');
        })();
    }

    cycle(elapsed) {
        super.cycle(elapsed * (this.world.category('bullet').size ? 0.1 : 1));

        this.makeHarmless(this.owner);
        this.makeHarmless(this.enemy);

        this.enemy.facing = -1;
        this.enemy.aim = angleBetween(this.enemy, this.owner);
    }

    render() {
        ctx.wrap(() => super.render());

        ctx.wrap(() => {
            ctx.globalAlpha = this.age % 2 < 1.5 ? 1 : 0.4;
            if (inputMode == INPUT_MODE_TOUCH) {
                renderTouchHint({ icon: 'play', text: '轻触跳过' }, DESIGN_WIDTH - 380, DESIGN_HEIGHT - 60, 56);
            } else {
                renderPanelText('按 [回车] 跳过', DESIGN_WIDTH - 30, DESIGN_HEIGHT - 40, 28, {
                    align: 'right',
                    baseline: 'bottom',
                    strokeWidth: 5,
                });
            }
        });
    }
}

class RevengeScreen extends StoryScreen {
    constructor() {
        super();

        this.cat = this.world.addEntity(new Cat());
        this.cat.x = this.cat.previousX = CELL_SIZE * 4;

        this.enemy = this.world.addEntity(new Human());
        this.enemy.x = CELL_SIZE * 8;

        this.cat.color = this.enemy.color = '#fff';
        this.cat.y = this.cat.previousY = this.enemy.y = CELL_SIZE * 2;

        this.world.addEntity(new HUD(this.cat));

        (async () => {
            await this.fadeIn();

            const label = this.world.addEntity(new Label('完成复仇'));
            label.x = CELL_SIZE * 6;
            label.y = CELL_SIZE / 2;
            label.z = 99;
            label.visibleStartAge = 0.1;

            while (this.enemy.health) await this.enemy.interp('_', 0, 0, 0);
            await this.world.addEntity(new Flash('#000')).interp('alpha', 0, 1, 0.4);

            this.enemy.health = 1;
            this.finalize('复仇完成');
        })();
    }

    cycle(elapsed) {
        super.cycle(elapsed * (this.enemy.health ? 1 : 0.1));
        this.makeHarmless(this.enemy);
    }
}
