import { LegatoError, errorMessages } from '.'

export class LegatoErrorNotConnectedCannotDisconnect extends LegatoError {
	constructor() {
		super('NOT_CONNECTED_CANNOT_DISCONNECT')
		this.message = errorMessages.NOT_CONNECTED_CANNOT_DISCONNECT()
	}
}
