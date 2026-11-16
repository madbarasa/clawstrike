class SettingsScreen extends Screen {

    title = '设置';

    absorb = true;

    constructor() {
        super();

        this.sheet = {
            x: (DESIGN_WIDTH - 720) / 2,
            y: 110,
            w: 720,
            h: 660,
        };

        const rowX = this.sheet.x + 40;
        const rowWidth = this.sheet.w - 80;

        this.toggleRows = [
            { id: 'sound', label: '音效与音乐', icon: 'volume', x: rowX, y: this.sheet.y + 110, w: rowWidth, h: 92 },
            { id: 'vibration', label: '振动反馈', icon: 'vibrate', x: rowX, y: this.sheet.y + 222, w: rowWidth, h: 92 },
        ];

        this.creditsButton = { x: rowX, y: this.sheet.y + 350, w: rowWidth, h: 92, label: '开发者名单', icon: 'group' };
        this.backButton = { x: rowX, y: this.sheet.y + 478, w: rowWidth, h: 88, label: '返回', icon: 'arrow-left' };

        this.onUiTap = (button) => {
            if (button === 'back' || button === 'settings') this.close();
        };
    }

    close() {
        this.resolve();
    }

    toggle(row) {
        if (row.id === 'sound') {
            setSoundEnabled(!SETTINGS.sound);
        } else {
            SETTINGS.vibration = !SETTINGS.vibration;
            saveSettings();
            vibrate(30);
        }

        zzfx(...[.5,,500,,.02,.14,,3.2,,,325,.05,.03,,,,,.79,.04,,-1129]);
    }

    handleTap(x, y) {
        for (const row of this.toggleRows) {
            if (pointInRect(x, y, row)) {
                this.toggle(row);
                return;
            }
        }

        if (pointInRect(x, y, this.creditsButton)) {
            G.navigate(new CreditsScreen());
            return;
        }

        if (pointInRect(x, y, this.backButton) || pointInRect(x, y, uiButtons().back)) {
            this.close();
            return;
        }

        // 面板外的空白区域同样关闭设置
        if (!pointInRect(x, y, this.sheet)) this.close();
    }

    render() {
        renderDimOverlay(0.72);
        renderSheet(this.sheet);

        renderPanelText(this.title, DESIGN_WIDTH / 2, this.sheet.y + 56, 46);

        for (const row of this.toggleRows) {
            renderToggleRow(row, row.icon, row.label, !!SETTINGS[row.id]);
        }

        renderTextButton(this.creditsButton, this.creditsButton.label, { icon: this.creditsButton.icon });
        renderTextButton(this.backButton, this.backButton.label, { icon: this.backButton.icon, accent: true });
    }
}
