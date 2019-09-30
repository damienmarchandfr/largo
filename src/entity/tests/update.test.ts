import { MongODMConnection } from '../../connection/connection'
import { MongODMEntity } from '../entity'
import { ObjectID } from 'mongodb'
import { MongODMField } from '../../decorators/field.decorator'

const databaseName = 'updateTest'

describe('update method', () => {
	it('should throw an error if collection does not exist', async () => {
		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		class RandomClassWithoutDecoratorUpdate extends MongODMEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		let hasError = false

		const id = new ObjectID()

		const random = new RandomClassWithoutDecoratorUpdate()
		random._id = id

		try {
			await random.update(connection)
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Collection randomclasswithoutdecoratorupdate does not exist.`
			)
		}
		expect(hasError).toEqual(true)
	})

	it('should update', async () => {
		class UserUpdate extends MongODMEntity {
			@MongODMField()
			email: string

			constructor(email: string) {
				super()
				this.email = email
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserUpdate('damien@dev.fr')

		// Insert a user with mongo native
		const insertResult = await connection.collections.userupdate.insertOne(user)

		user._id = insertResult.insertedId

		// Update email
		user.email = 'jeremy@dev.fr'
		await user.update(connection)

		// Find user
		const updated = await connection.collections.userupdate.findOne({
			_id: insertResult.insertedId,
		})

		expect(updated.email).toEqual(user.email)
	})

	it('should not update prop without decorator', async () => {
		class UserUpdateNotDecorator extends MongODMEntity {
			@MongODMField()
			email: string

			age: number

			constructor(email: string) {
				super()
				this.email = email
				this.age = 2
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserUpdateNotDecorator('damien@dev.fr')

		// Add user
		const userCopy = { ...user }
		delete userCopy.age

		const insertResult = await connection.collections.userupdatenotdecorator.insertOne(
			userCopy
		)

		// Update
		user.age = 18
		await user.update(connection)

		// Get user in db
		const saved = await connection.collections.userupdatenotdecorator.findOne({
			_id: insertResult.insertedId,
		})

		expect(saved.age).toBeUndefined()
	})

	it('should trigger beforeUpdate', async (done) => {
		class UserBeforeUpdate extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor(firstname: string) {
				super()
				this.firstname = firstname
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = await connection.collections.userbeforeupdate.insertOne({
			firstname: 'Damien',
		})
		const id = user.insertedId

		const updateUser = new UserBeforeUpdate('Damien')
		updateUser._id = id

		updateUser.events.beforeUpdate.subscribe((update) => {
			const source = update.oldValue
			const partial = update.partial

			expect(source._id).toBeDefined()
			expect(source.firstname).toEqual('Damien')

			expect(partial._id).not.toBeDefined()
			expect(partial.firstname).toEqual('Jeremy')

			done()
		})

		updateUser.firstname = 'Jeremy'
		await updateUser.update(connection)
	})

	it('should trigger afterUpdate', async (done) => {
		class UserAfterUpdate extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor(firstname: string) {
				super()
				this.firstname = firstname
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = await connection.collections.userafterupdate.insertOne({
			firstname: 'Damien',
		})
		const id = user.insertedId

		const updateUser = new UserAfterUpdate('Damien')
		updateUser._id = id

		updateUser.events.afterUpdate.subscribe((updateResult) => {
			const before = updateResult.oldValue
			const after = updateResult.newValue

			expect(before._id).toBeDefined()
			expect(before._id).toStrictEqual(after._id)

			expect(before.firstname).toEqual('Damien')
			expect(after.firstname).toEqual('Jeremy')

			done()
		})

		updateUser.firstname = 'Jeremy'
		await updateUser.update(connection)
	})
})
