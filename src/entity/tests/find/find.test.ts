import { LegatoConnection } from '../../../connection'
import { LegatoEntity } from '../..'
import { LegatoField } from '../../../decorators/field.decorator'

const databaseName = 'findTest'

describe('static method find', () => {
	it('should throw an error if collection does not exist', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		class RandomClassWithoutDecoratorFind extends LegatoEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}

		let hasError = false

		try {
			await RandomClassWithoutDecoratorFind.find<
				RandomClassWithoutDecoratorFind
			>({ name: 'toto' })
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoCollectionDoesNotExistError)
		}

		expect(hasError).toEqual(true)
	})

	it('should find one element using filter', async () => {
		class UserFindAllWithFilterStatic extends LegatoEntity {
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

		// Insert users with mongodb native lib
		await connection.collections.userfindallwithfilterstatic.insertOne(
			new UserFindAllWithFilterStatic('damien@dev.fr')
		)

		const users = await UserFindAllWithFilterStatic.find<
			UserFindAllWithFilterStatic
		>({
			email: 'damien@dev.fr',
		})

		expect(users.length()).toEqual(1)

		const copy = users.items[0].getCopy()

		expect(copy).toStrictEqual({
			_id: users.items[0]._id,
			email: 'damien@dev.fr',
		})
	})

	it('should find all with empty filter', async () => {
		class UserFindAllStatic extends LegatoEntity {
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

		// Insert users with mongodb native lib
		await connection.collections.userfindallstatic.insertOne(
			new UserFindAllStatic('damien@dev.fr')
		)
		await connection.collections.userfindallstatic.insertOne(
			new UserFindAllStatic('jeremy@dev.fr')
		)

		const users = await UserFindAllStatic.find<UserFindAllStatic>(
			connection,
			{}
		)

		expect(users.length()).toEqual(2)

		for (const user of users.items) {
			expect(user.getCopy()).toStrictEqual({
				_id: user._id,
				email: user.email,
			})
		}
	})

	it('should not find and return emtpy array', async () => {
		class UserFindAllStaticEmpty extends LegatoEntity {
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

		await new UserFindAllStaticEmpty().insert()

		const bads = await UserFindAllStaticEmpty.find({
			email: 'donal@trump.usa',
		})

		expect(bads.length()).toEqual(0)
	})
})
