import { LegatoConnection } from '../../../connection'
import {
	UpdateManyEntityTestNoDecorator,
	UpdateManyEntityTest,
} from './entities/UpdateMany.entity.test'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import { getConnection, setConnection } from '../../..'

const databaseName = 'updatemanyTest'

describe(`static method updateMany`, () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should throw an error if collection does not exist', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		try {
			await UpdateManyEntityTestNoDecorator.updateMany<
				UpdateManyEntityTestNoDecorator
			>({ name: 'john' }, { name: 'damien' })
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toEqual(true)
	})

	it('should update one element with query filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj1 = new UpdateManyEntityTest('john doe 1')
		const obj2 = new UpdateManyEntityTest('john doe 2')
		await connection.collections.UpdateManyEntityTest.insertMany([obj1, obj2])

		// Update
		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{ name: 'john doe 1' },
			{ name: 'john doe 1.5' }
		)

		// Search old value
		let counter = await connection.collections.UpdateManyEntityTest.countDocuments(
			{ name: 'john doe 1' }
		)
		expect(counter).toEqual(0)

		// Get updated
		counter = await connection.collections.UpdateManyEntityTest.countDocuments({
			name: 'john doe 1.5',
		})
		expect(counter).toEqual(1)

		// Get not updated
		counter = await connection.collections.UpdateManyEntityTest.countDocuments({
			name: 'john doe 2',
		})
		expect(counter).toEqual(1)
	})

	it('should update many element with query filter', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		// Create 3 elements
		const obj1 = new UpdateManyEntityTest('john')
		const obj2 = new UpdateManyEntityTest('john')
		const obj3 = new UpdateManyEntityTest('doe')

		await connection.collections.UpdateManyEntityTest.insertMany([
			obj1,
			obj2,
			obj3,
		])

		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{ name: 'john' },
			{ name: 'john updated' }
		)

		let updated = await connection.collections.UpdateManyEntityTest.findOne({
			_id: obj1._id,
		})
		expect(updated.name).toEqual('john updated')

		updated = await connection.collections.UpdateManyEntityTest.findOne({
			_id: obj2._id,
		})
		expect(updated.name).toEqual('john updated')

		const notUpdated = await connection.collections.UpdateManyEntityTest.findOne(
			{ _id: obj3._id }
		)
		expect(notUpdated.name).toEqual('doe')
	})

	it('should update all elements with empty query filter', async () => {
		const connection = await new LegatoConnection({ databaseName }).connect({
			clean: true,
		})

		// Create 3 elements
		const obj1 = new UpdateManyEntityTest('john')
		const obj2 = new UpdateManyEntityTest('doe')
		const obj3 = new UpdateManyEntityTest('damien')

		await connection.collections.UpdateManyEntityTest.insertMany([
			obj1,
			obj2,
			obj3,
		])

		await UpdateManyEntityTest.updateMany<UpdateManyEntityTest>(
			{},
			{ name: 'john updated' }
		)

		const updatedCounter = await connection.collections.UpdateManyEntityTest.countDocuments(
			{ name: 'john updated' }
		)
		expect(updatedCounter).toEqual(3)
	})
})
