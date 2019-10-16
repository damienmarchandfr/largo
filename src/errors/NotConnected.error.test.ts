import { LegatoErrorNotConnected } from './NotConnected.error'
import { errorCodes } from '.'

describe('NotConnected error', () => {
	it('should be valid', () => {
		const error = new LegatoErrorNotConnected()
		expect(error.code).toEqual(errorCodes.NOT_CONNECTED)
		expect(error.type).toEqual('NOT_CONNECTED')
		expect(error.message).toEqual('You are not connected to MongoDB.')
	})
})
