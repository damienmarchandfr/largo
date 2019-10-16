import { LegatoErrorObjectAlreadyInserted } from './ObjectAlreadyInserted.error'
import { LegatoEntity } from '../entity'
import { ObjectId } from 'mongodb'
import { errorCodes } from '.'

describe('ObjectAlreadyInserted error', () => {
	it('should be valid', () => {
		class LegatoErrorObjectAlreadyInsertedTestClass extends LegatoEntity {}

		const obj = new LegatoErrorObjectAlreadyInsertedTestClass()
		obj._id = new ObjectId()
		const error = new LegatoErrorObjectAlreadyInserted(obj)
		expect(error.code).toEqual(errorCodes.OBJECT_ALREADY_INSERTED)
		expect(error.message).toEqual(
			`LegatoErrorObjectAlreadyInsertedTestClass already in database with _id : ${obj._id}`
		)
	})
})
