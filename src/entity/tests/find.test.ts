import { MongODMConnection } from '../../connection/connection'
import { MongODMEntity } from '../entity'
import { MongODMCollectionDoesNotExistError } from '../../errors/errors'
import { MongODMField } from '../../decorators/field.decorator'

const databaseName = 'findTest'

describe('static method find', () => {
	it('should throw an error if collection does not exist', async () => {
		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		class RandomClassWithoutDecoratorFind extends MongODMEntity {
			name: string

			constructor() {
				super()
				this.name = 'toto'
			}
		}
		0
		let hasError = false

		try {
			await RandomClassWithoutDecoratorFind.find<
				RandomClassWithoutDecoratorFind
			>(connection, { name: 'toto' })
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(MongODMCollectionDoesNotExistError)
		}

		expect(hasError).toEqual(true)
	})

	it('should find all with empty filter', async () => {
		class UserFindAllStatic extends MongODMEntity {
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

		// Insert users with mongodb native lib
		await connection.collections.userfindallstatic.insertOne(
			new UserFindAllStatic('damien@dev.fr')
		)
		await connection.collections.userfindallstatic.insertOne(
			new UserFindAllStatic('jeremy@dev.fr')
		)

		const users = await UserFindAllStatic.find(connection, {})

		expect(users.length()).toEqual(2)
	})

	it('should not find and return emtpy array', async () => {
		class UserFindAllStaticEmpty extends MongODMEntity {
			@MongODMField()
			email: string

			constructor() {
				super()
				this.email = 'damien@marchand.fr'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		await new UserFindAllStaticEmpty().insert(connection)

		const bads = await UserFindAllStaticEmpty.find(connection, {
			email: 'donal@trump.usa',
		})

		expect(bads.length()).toEqual(0)
	})
})
