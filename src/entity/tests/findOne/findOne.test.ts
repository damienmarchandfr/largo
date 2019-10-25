import { LegatoConnection } from '../../../connection'
import { LegatoEntity } from '../..'
import { LegatoField } from '../../../decorators/field.decorator'

const databaseName = 'findoneTest'

describe('static method findOne', () => {
	it('should throw an error if collection does not exist', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		class RandomClassWithoutDecoratorFindOne extends LegatoEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		let hasError = false

		try {
			await RandomClassWithoutDecoratorFindOne.findOne<
				RandomClassWithoutDecoratorFindOne
			>({ name: 'toto' })
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Collection randomclasswithoutdecoratorfindone does not exist.`
			)
			expect(error.code).toEqual('Legato_ERROR_404')
		}

		expect(hasError).toEqual(true)
	})

	it('should findOne', async () => {
		class UserFindOneStatic extends LegatoEntity {
			@LegatoField()
			email: string

			constructor() {
				super()
				this.email = 'damien@marchand.fr'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert user with mongodb native lib
		await connection.collections.userfindonestatic.insertOne(
			new UserFindOneStatic()
		)

		const user = await UserFindOneStatic.findOne<UserFindOneStatic>({
			email: 'damien@marchand.fr',
		})

		const userResult = user as UserFindOneStatic

		expect(user).not.toBe(null)
		expect(userResult.email).toEqual('damien@marchand.fr')

		expect(userResult.getCopy()).toEqual({
			_id: userResult._id,
			email: 'damien@marchand.fr',
		})
	})

	it('should not find and return null', async () => {
		class UserFindOneStaticNull extends LegatoEntity {
			@LegatoField()
			email: string

			constructor() {
				super()
				this.email = 'damien@marchand.fr'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert user with mongodb native lib
		await connection.collections.userfindonestaticnull.insertOne(
			new UserFindOneStaticNull()
		)

		const user = await UserFindOneStaticNull.findOne({
			email: 'donal@trump.usa',
		})

		expect(user).toEqual(null)
	})
})
