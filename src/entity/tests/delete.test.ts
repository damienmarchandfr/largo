import { LegatoConnection } from '../../connection'
import { LegatoEntity } from '..'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../decorators/field.decorator'

const databaseName = 'deleteTest'

describe('delete method', () => {
	it('should throw an error if collection does not exist', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		class RandomClassWithoutDecoratorDelete extends LegatoEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		let hasError = false

		const random = new RandomClassWithoutDecoratorDelete()
		const id = new ObjectID()
		random._id = id

		try {
			await random.delete(connection)
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Collection randomclasswithoutdecoratordelete does not exist.`
			)
			expect(error.code).toEqual('Legato_ERROR_404')
		}

		expect(hasError).toEqual(true)
	})

	it('should delete', async () => {
		class UserDelete extends LegatoEntity {
			@LegatoField()
			email: string

			constructor(email: string) {
				super()
				this.email = email
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const user = new UserDelete('damien@dev.fr')

		const insertResult = await connection.collections.userdelete.insertOne(user)
		user._id = insertResult.insertedId

		// Check user in db
		const check = await connection.collections.userdelete.findOne({
			_id: user._id,
		})
		expect(check.email).toEqual(user.email)

		// Delete
		await user.delete(connection)
		const checkDeleted = await connection.collections.userdelete.findOne({
			_id: user._id,
		})
		expect(checkDeleted).toEqual(null)
	})

	it('should trigger beforeDelete', async (done) => {
		class UserBeforeDelete extends LegatoEntity {
			@LegatoField()
			email: string

			constructor(email: string) {
				super()
				this.email = email
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const inserted = await connection.collections.userbeforedelete.insertOne({
			email: 'damien@dev.fr',
		})

		const user = new UserBeforeDelete('damien@de.fr')
		user._id = inserted.insertedId

		user.events.beforeDelete.subscribe((userBeforeDelete) => {
			expect(userBeforeDelete._id).toStrictEqual(inserted.insertedId)
			done()
		})

		await user.delete(connection)
	})

	it('should trigger afterDelete', async (done) => {
		class UserAfterDelete extends LegatoEntity {
			@LegatoField()
			email: string

			constructor(email: string) {
				super()
				this.email = email
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const inserted = await connection.collections.userafterdelete.insertOne({
			email: 'damien@dev.fr',
		})

		const user = new UserAfterDelete('damien@dev.fr')
		user._id = inserted.insertedId

		user.events.afterDelete.subscribe(async (userDeleted) => {
			expect(userDeleted._id).toStrictEqual(inserted.insertedId)

			// Check if in db
			const checkUser = await connection.collections.userafterdelete.findOne({
				_id: inserted.insertedId,
			})

			expect(checkUser).toEqual(null)

			done()
		})

		await user.delete(connection)
	})
})
