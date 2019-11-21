import { LegatoConnection } from '../../../connection'
import { LegatoEntity } from '../..'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../../decorators/field.decorator'
import { getConnection, setConnection } from '../../..'
import {
	UpdateTestWithoutDecorator,
	UpdateTest,
} from './entities/Update.entity.test'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'

const databaseName = 'updateTest'

describe('update method', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should throw an error if collection does not exist', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		const id = new ObjectID()

		const obj = new UpdateTestWithoutDecorator('john')
		obj._id = id

		try {
			await obj.update()
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}
		expect(hasError).toEqual(true)
	})

	it('should update', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = new UpdateTest('john')

		// Insert a user with mongo native
		await connection.collections.UpdateTest.insertOne(obj)

		obj.name = 'john doe'
		await obj.update()

		// Copy is set
		const copy = obj.getCopy()
		expect(copy).toMatchObject({
			_id: obj._id,
			name: 'john doe',
		})

		const updated = await connection.collections.UpdateTest.findOne({
			_id: obj._id,
		})

		expect(updated.name).toEqual('john doe')
	})

	// 	it('should not update prop without decorator', async () => {
	// 		class UserUpdateNotDecorator extends LegatoEntity {
	// 			@LegatoField()
	// 			email: string

	// 			age: number

	// 			constructor(email: string) {
	// 				super()
	// 				this.email = email
	// 				this.age = 2
	// 			}
	// 		}

	// 		const connection = await new LegatoConnection({
	// 			databaseName,
	// 		}).connect({
	// 			clean: true,
	// 		})

	// 		const user = new UserUpdateNotDecorator('damien@dev.fr')

	// 		// Add user
	// 		const userCopy = { ...user }
	// 		delete userCopy.age

	// 		const insertResult = await connection.collections.userupdatenotdecorator.insertOne(
	// 			userCopy
	// 		)

	// 		// Update
	// 		user.age = 18
	// 		await user.update()

	// 		// Get user in db
	// 		const saved = await connection.collections.userupdatenotdecorator.findOne({
	// 			_id: insertResult.insertedId,
	// 		})

	// 		expect(saved.age).toBeUndefined()
	// 	})

	// 	it('should trigger beforeUpdate', async (done) => {
	// 		class UserBeforeUpdate extends LegatoEntity {
	// 			@LegatoField()
	// 			firstname: string

	// 			constructor(firstname: string) {
	// 				super()
	// 				this.firstname = firstname
	// 			}
	// 		}

	// 		const connection = await new LegatoConnection({
	// 			databaseName,
	// 		}).connect({
	// 			clean: true,
	// 		})

	// 		const user = await connection.collections.userbeforeupdate.insertOne({
	// 			firstname: 'Damien',
	// 		})
	// 		const id = user.insertedId

	// 		const updateUser = new UserBeforeUpdate('Damien')
	// 		updateUser._id = id

	// 		updateUser.events.beforeUpdate.subscribe((update) => {
	// 			const source = update.oldValue
	// 			const partial = update.partial

	// 			expect(source._id).toBeDefined()
	// 			expect(source.firstname).toEqual('Damien')

	// 			expect(partial._id).not.toBeDefined()
	// 			expect(partial.firstname).toEqual('Jeremy')

	// 			done()
	// 		})

	// 		updateUser.firstname = 'Jeremy'
	// 		await updateUser.update()
	// 	})

	// 	it('should trigger afterUpdate', async (done) => {
	// 		class UserAfterUpdate extends LegatoEntity {
	// 			@LegatoField()
	// 			firstname: string

	// 			constructor(firstname: string) {
	// 				super()
	// 				this.firstname = firstname
	// 			}
	// 		}

	// 		const connection = await new LegatoConnection({
	// 			databaseName,
	// 		}).connect({
	// 			clean: true,
	// 		})

	// 		const user = await connection.collections.userafterupdate.insertOne({
	// 			firstname: 'Damien',
	// 		})
	// 		const id = user.insertedId

	// 		const updateUser = new UserAfterUpdate('Damien')
	// 		updateUser._id = id

	// 		updateUser.events.afterUpdate.subscribe((updateResult) => {
	// 			const before = updateResult.oldValue
	// 			const after = updateResult.newValue

	// 			expect(before._id).toBeDefined()
	// 			expect(before._id).toStrictEqual(after._id)

	// 			expect(before.firstname).toEqual('Damien')
	// 			expect(after.firstname).toEqual('Jeremy')

	// 			done()
	// 		})

	// 		updateUser.firstname = 'Jeremy'
	// 		await updateUser.update()
	// 	})
})
