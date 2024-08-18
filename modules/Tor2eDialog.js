export default class Tor2eDialog extends Dialog {

    constructor(...args) {
        super(...args);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".special-success-element").click(this._onSpecialSuccessElementClick.bind(this));
    }

    _onSpecialSuccessElementClick(event) {
        event.preventDefault();
        const element = event.currentTarget;
        let elements = element.closest(".special-success-elements");
        let activeElement = $(elements).children(".special-success-element").not(".inactive")[0];
        $(element).toggleClass("inactive");
        $(activeElement).toggleClass("inactive");
    }
}