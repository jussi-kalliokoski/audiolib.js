function AutomationClass(parameter, automation, amount, type){
	this.parameter	= parameter;
	this.automation	= automation;
	this.amount	= isNaN(amount) ? this.amount : amount;
	this.setType(type);
}

AutomationClass.prototype = {
	parameter:	'',
	automation:	null,
	amount:		1,
	type:		'modulation',
	mode:		null,
	setType: function(type){
		if (type){
			if (typeof type === 'function'){
				this.type = type.name || 'custom';
				this.mode = type;
			}
			this.type	= type;
			this.mode	= Automation.modes[type];
		} else {
			this.mode	= this.mode || Automation.modes[this.type];
		}
	},
};

function Automation(fx, parameter, automation, amount, type){
	if (!fx.automation){
		fx.automation = [];
		switch (fx.type){
		case 'generator':
			fx.append = Automation.generatorAppend;		break;
		case 'effect':
			fx.append = Automation.effectAppend;		break;
		case 'buffereffect':
			fx.append = Automation.bufferEffectAppend;	break;
		}
	}
	var automation = new AutomationClass(parameter, automation, amount, type);
	fx.automation.push(automation);
	return automation;
}

Automation.generatorAppend = function(buffer, channelCount, out){
	var	self	= this,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		z, i, n, m, a;
	out		= out || buffer;
	channelCount	= channelCount || self.channelCount;
	for (m=0; m<k; m++){
		def.push(self[self.automation[m].parameter]);
	}
	for (i=0, z=0; i<l; i+=channelCount, z++){
		for (m=0; m<k; m++){
			self[self.automation[m].parameter] = def[m];
		}
		for (m=0; m<k; m++){
			a = self.automation[m];
			a.mode(self, a.parameter, a.amount * a.automation.generatedBuffer[z]);
		}

		self.generate();

		for (n=0; n<channelCount; n++){
			out[i + n] = self.getMix(n) * self.mix + buffer[i + n];
		}
	}
	for (m=0; m<k; m++){
		self[self.automation[m].parameter] = def[m];
	}
	return out;
};

Automation.effectAppend = function(buffer, channelCount, out){
	var	self	= this,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		z, i, n, m, a;
	out		= out || buffer;
	channelCount	= channelCount || self.channelCount;
	for (m=0; m<k; m++){
		def.push(self[self.automation[m].parameter]);
	}
	for (i=0, z=0; i<l; i+=channelCount, z++){
		for (m=0; m<k; m++){
			self[self.automation[m].parameter] = def[m];
		}
		for (m=0; m<k; m++){
			a = self.automation[m];
			a.mode(self, a.parameter, a.amount * a.automation.generatedBuffer[z]);
		}

		for (n=0; n<channelCount; n++){
			self.pushSample(buffer[i + n], n);
			out[i + n] = self.getMix(n) * self.mix + buffer[i + n] * (1 - self.mix);
		}
	}
	for (m=0; m<k; m++){
		self[self.automation[m].parameter] = def[m];
	}
	return out;
};

Automation.bufferEffectAppend = function(buffer, channelCount, out){
	var	self	= this,
		ch	= channelCount || self.channelCount,
		l	= buffer.length,
		k	= self.automation.length,
		def	= [],
		i, n, m, z, a, x;
	out		= out || buffer;
	for (m=0; m<k; m++){
		def.push([]);
		for (n=0; n<ch; n++){
			def[m].push(self.effects[n][self.automation[m].parameter]);
		}
	}
	for (x=0, i=0; i<l; i+=ch, x++){
		for (n=0; n<ch; n++){
			for (m=0; m<k; m++){
				a = self.automation[m];
				self.effects[n][a.parameter] = def[m][n];
				a.mode(self.effects[n], a.parameter, a.amount * a.automation.generatedBuffer[x]);
			}
			out[i + n] = self.effects[n].pushSample(buffer[i + n]) * self.mix + buffer[i + n] * (1 - self.mix);
		}
	}
	for (m=0; m<k; m++){
		for (n=0; n<ch; n++){
			self.effects[n][self.automation[m].parameter] = def[m][n];
		}
	}
	return out;
};

Automation.modes = {
	modulation: function(fx, param, value){
		fx.setParam(param, fx[param] * value);
	},
	addition: function(fx, param, value){
		fx.setParam(param, fx[param] + value);
	},
	subtraction: function(fx, param, value){
		fx.setParam(param, fx[param] - value);
	},
	additiveModulation: function(fx, param, value){
		fx.setParam(param, fx[param] + fx[param] * value);
	},
	subtractiveModulation: function(fx, param, value){
		fx.setParam(param, fx[param] - fx[param] * value);
	},
	assignment: function(fx, param, value){
		fx.setParam(param, value);
	},
	absoluteAssignment: function(fx, param, value){
		fx.setParam(param, Math.abs(value));
	},
};

Automation.__constructror		= AutomationClass;
