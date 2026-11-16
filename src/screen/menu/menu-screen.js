class MenuScreen extends Screen {

    render() {
        // 遮罩盖住底下的游戏画面与虚拟按键，避免按键与菜单文字互相干扰
        renderDimOverlay(0.72);

        ctx.wrap(() => this.renderTitle());

        if (inputMode == INPUT_MODE_TOUCH) {
            ctx.wrap(() => this.renderCommandHints(DESIGN_HEIGHT * 0.66));
        } else {
            ctx.wrap(() => this.renderKeyboardCommands(DESIGN_HEIGHT * 0.66));
        }
    }

    renderTitle() {
        renderPanelText(this.title, DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.28, 104, { strokeWidth: 16 });
    }
}
