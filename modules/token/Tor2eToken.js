import {tor2eUtilities} from "../utilities.js";

export class Tor2eToken extends Token {

    /** @override */
    /**
     * Add or remove the currently controlled Tokens from the active combat encounter
     * @param {Combat} [combat]    A specific combat encounter to which this Token should be added
     * @returns {Promise<Token>} The Token which initiated the toggle
     */
    async toggleCombat(combat) {
        await this.layer.toggleCombat(!this.inCombat, combat, {token: this});
        return this;
        //return super.toggleCombat(combat);
    }

    /** @override */
    async _draw() {
        await super._draw()

        let stance =
            this.combatant?.actor?.extendedData?.isCharacter ? this.combatant.getStance() : undefined;

        if (stance == null) {
            this.children = this.children.filter(child => !child.flags?.stance)
        } else {
            await this._drawStance(stance);
        }
    }

    async _drawStance(stance) {
        if (!this.scene || tor2eUtilities.combat.noActiveCombatInScene(this.scene.id)) return;

        this.cardTexture = await loadTexture(stance.logo, {fallback: CONST.DEFAULT_TOKEN});
        this.card = PIXI.Sprite.from(this.cardTexture);
        this.card.width = this.w * 0.28;
        this.card.height = this.h * 0.28;
        this.card.position.set(this.w * 0.6 + 1, this.h * 0.6 + 1);

        if (!this.card.bg) {
            const background = new PIXI.Graphics();
            background.flags = {stance: true};
            this.card.bg = this.addChild(background);
        }
        // Background
        this.card.bg
            .clear()
            .beginFill(0x000000, 0.7)
            .drawRoundedRect(this.w * 0.56 - 2, this.h * 0.55 - 2, this.card.width + 10, this.card.height + 10, 25)
            .endFill();

        // creating pixi object  from actor.data.data.cardImage
        this.card.parent = this;
        this.card.flags = {stance: true};
        //appending card to Token
        this.addChild(this.card);
    }

    async function(combat) {
        if (!this.actor || (!this.inCombat && !game.actors.find((a) => a.id === this.actor.id))) {
            ui.notifications.error(game.i18n.format("tor2e.combat.error.noActorAttachedToToken", {
                name: this.name
            }));
            return this;
        }
        await this.layer.toggleCombat(!this.inCombat, combat, {token: this});

        if (this.actor.extendedData.isCharacter) {
            await this._draw();
            this.visible = true;
        }
        return this;
    }
}
