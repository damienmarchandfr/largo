import { LegatoConnection } from '../../connection'
import { LegatoEntity } from '..'
import { LegatoField } from '../../decorators/field.decorator'

const databaseName = 'deletemanyTest'

describe('static method deleteMany', () => {
	it('should throw an error if collection does not exist', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		class RandomClassWithoutDecoratorDeleteManyStatic extends LegatoEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		let hasError = false

		try {
			await RandomClassWithoutDecoratorDeleteManyStatic.deleteMany({
				name: 'toto',
			})
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Collection randomclasswithoutdecoratordeletemanystatic does not exist.`
			)
		}

		expect(hasError).toEqual(true)
	})

	it('shoud delete with query filter', async () => {
		class UserDeleteManyQueryFilter extends LegatoEntity {
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

		// Add 2 users
		await connection.collections.userdeletemanyqueryfilter.insertMany([
			new UserDeleteManyQueryFilter('damien@marchand.fr'),
			new UserDeleteManyQueryFilter('donald@trump.usa'),
		])

		// Delete donald
		await UserDeleteManyQueryFilter.deleteMany<UserDeleteManyQueryFilter>({
			email: 'donald@trump.usa',
		})

		// Search for Donald
		const donald = await connection.collections.userdeletemanyqueryfilter.findOne(
			{
				email: 'donald@trump.usa',
			}
		)

		expect(donald).toEqual(null)
	})

	it('should delete all if no query filter', async () => {
		class UserDeleteManyDeleteAll extends LegatoEntity {
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

		// Add 2 users
		await connection.collections.userdeletemanydeleteall.insertMany([
			new UserDeleteManyDeleteAll('damien@marchand.fr'),
			new UserDeleteManyDeleteAll('donald@trump.usa'),
		])

		// Delete all users
		await UserDeleteManyDeleteAll.deleteMany(connection)
		const countUser = await connection.collections.userdeletemanydeleteall.countDocuments()

		expect(countUser).toEqual(0)
	})
})
