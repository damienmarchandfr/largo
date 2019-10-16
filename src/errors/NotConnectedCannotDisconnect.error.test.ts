import { LegatoErrorNotConnectedCannotDisconnect } from './NotConnectedCannotDisconnect.error'
import { errorCodes } from '.'

describe('NotConnectedCannotDisconnect error', () => {
	it('should be valid', () => {
		const error = new LegatoErrorNotConnectedCannotDisconnect()
		expect(error.code).toEqual(errorCodes.NOT_CONNECTED_CANNOT_DISCONNECT)
		expect(error.type).toEqual('NOT_CONNECTED_CANNOT_DISCONNECT')
		expect(error.message).toEqual(
			'Cannot disconnect cause not connected to MongoDB.'
		)
	})
})
