import { LegatoConnection } from '../../connection'
import { LegatoEntity } from '..'
import { LegatoField } from '../../decorators/field.decorator'

const databaseName = 'updatemanyTest'

describe(`static method updateMany`, () => {
	it('should throw an error if collection does not exist', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		class RandomClassWithoutDecoratorUpdateMany extends LegatoEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		let hasError = false

		try {
			await RandomClassWithoutDecoratorUpdateMany.updateMany<
				RandomClassWithoutDecoratorUpdateMany
			>(connection, { name: 'titi' }, { name: 'toto' })
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Collection randomclasswithoutdecoratorupdatemany does not exist.`
			)
			expect(error.code).toEqual('Legato_ERROR_404')
		}

		expect(hasError).toEqual(true)
	})

	it('should update one element with query filter', async () => {
		class UserUpdateManyOneElement extends LegatoEntity {
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

		// Insert user with mongodb native lib
		await connection.collections.userupdatemanyoneelement.insertMany([
			new UserUpdateManyOneElement('damien@marchand.fr'),
			new UserUpdateManyOneElement('donald@trump.usa'),
		])

		// Update
		await UserUpdateManyOneElement.updateMany<UserUpdateManyOneElement>(
			connection,
			{ email: 'barack@obama.usa' },
			{ email: 'donald@trump.usa' }
		)

		// Search with email
		const trump = await connection.collections.userupdatemanyoneelement.findOne(
			{
				email: 'donald@trump.usa',
			}
		)

		expect(trump).toEqual(null)

		const barack = await connection.collections.userupdatemanyoneelement.findOne(
			{
				email: 'barack@obama.usa',
			}
		)

		expect(barack.email).toEqual('barack@obama.usa')
	})
})
