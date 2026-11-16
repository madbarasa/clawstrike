class CreditsScreen extends Screen {

    title = '开发者名单';

    absorb = true;

    constructor() {
        super();

        this.sheet = {
            x: (DESIGN_WIDTH - 760) / 2,
            y: 90,
            w: 760,
            h: 700,
        };

        this.backButton = {
            x: this.sheet.x + 40,
            y: this.sheet.y + this.sheet.h - 110,
            w: this.sheet.w - 80,
            h: 80,
            label: '返回',
            icon: 'arrow-left',
        };

        this.onUiTap = (button) => {
            if (button === 'back' || button === 'settings') this.close();
        };
    }

    close() {
        this.resolve();
    }

    handleTap(x, y) {
        if (pointInRect(x, y, this.backButton) || pointInRect(x, y, uiButtons().back)) {
            this.close();
        }
    }

    render() {
        renderDimOverlay(0.75);
        renderSheet(this.sheet);

        renderPanelText(this.title, DESIGN_WIDTH / 2, this.sheet.y + 56, 44);

        let y = this.sheet.y + 130;

        for (const { role, name } of DEVELOPERS) {
            ctx.wrap(() => {
                ctx.textAlign = nomangle('right');
                ctx.textBaseline = nomangle('middle');
                ctx.font = uiFont(24, 'normal');
                ctx.fillStyle = 'rgba(140,220,255,0.9)';
                ctx.fillText(role, this.sheet.x + this.sheet.w / 2 - 26, y);

                ctx.textAlign = nomangle('left');
                ctx.font = uiFont(26);
                ctx.fillStyle = '#fff';
                ctx.fillText(name, this.sheet.x + this.sheet.w / 2 + 26, y);
            });

            y += 56;
        }

        renderTextButton(this.backButton, this.backButton.label, { icon: this.backButton.icon });
    }
}
