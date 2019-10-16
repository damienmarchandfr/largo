import { LegatoErrorCollectionDoesNotExist } from './CollectionDoesNotExist.error'
import { errorCodes } from '.'

describe('CollectionDoesNotExist error', () => {
	it('should be valid', () => {
		const error = new LegatoErrorCollectionDoesNotExist('collectionName')
		expect(true).toEqual(true)

		expect(error.code).toEqual(errorCodes.COLLECTION_DOES_NOT_EXIST)
		expect(error.type).toEqual('COLLECTION_DOES_NOT_EXIST')
		expect(error.message).toEqual('Collection collectionName does not exist.')
	})
})
