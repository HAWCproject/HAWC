const Component = require("./Component");

const Types ={BUTTON: "toggleButton", VALUE_OUTPUT:"valueOutput"};

class ComponentFactory
{
  static CreateButton(id, name, state, gpioPin) {
    return new Component(Types.BUTTON, id, name, null, state, gpioPin);
  }

  static ValueOutput(id, name, value, gpioPin) {
    return new Component(Types.VALUE_OUTPUT, id, name, value, null, gpioPin);
  }

}


module.exports = ComponentFactory;
