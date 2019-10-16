import { LegatoError, errorMessages } from '.'

export class LegatoErrorNotConnected extends LegatoError {
	constructor() {
		super('NOT_CONNECTED')
		this.message = errorMessages.NOT_CONNECTED()
	}
}
