import * as Masks from './masks';

var maskKeys = Object.keys(Masks);

export default class MaskResolver {
	static resolve(type) {
		if (type == undefined)
			type='none';

		let maskKey = maskKeys.find(m => {
			var handler = Masks[m];
			return handler && handler.getType && handler.getType() === type;
		});

		let handler = Masks[maskKey];

		if(!handler) {
			handler = Masks["none"]
		}

		return new handler();
	}
}
