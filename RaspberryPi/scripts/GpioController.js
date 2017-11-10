var rpio = require('rpio');

class GpioController{


static setButtonState(pin, state){
		//Setup data.component.pin as output
		rpio.open(pin, rpio.OUTPUT);

		//Pretty specifically uses .HIGH/.LOW, so if/else instead of passing in data.component.state.
		if (state == 1) {
			rpio.write(pin, rpio.HIGH);
			console.log("Pin " + pin + " is set to high");
		}
		else {
			rpio.write(pin, rpio.LOW);
			console.log("Pin " + pin + " is set to low");
		}
	}
}

module.exports = GpioController;
