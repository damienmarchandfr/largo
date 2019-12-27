import { setConnection, getConnection } from './index'
import { LegatoConnection } from './connection'

const databaseName = 'internalTest'

describe('set connection', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should throw error if set a disconnected LegatoConnection', () => {
		const connection = new LegatoConnection({
			databaseName,
		})

		let hasError = false

		try {
			setConnection(connection)
		} catch (error) {
			expect(error.message).toEqual(
				'Cannot set connection. Cause not connected.'
			)
			hasError = true
		}

		expect(hasError).toBeTruthy()
	})
})
