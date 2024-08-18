export default class SocketHandlers {
    static async updateCombatantStance(data) {
        if (!game.user.isGM) return

        const combat = game.combats.get(data?.payload?.combatId)
        if (!combat) return

        await combat.updateCombatant(data.payload);

    }
}