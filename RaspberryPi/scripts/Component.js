class Component
{
  constructor(type, id, name, value, state, gpioPin){
    this.id= id;
    this.type = type;
    this.name = name;
    this.value = value;
    this.state = state;
    this.gpioPin = gpioPin;
  }
}
module.exports = Component;
