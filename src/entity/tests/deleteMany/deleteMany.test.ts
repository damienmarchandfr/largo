import { LegatoConnection } from '../../../connection'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import {
	DeleteManyEntityTest,
	DeleteManyEntityTestNoDecorator,
} from './entities/DeleteMany.entity.test'
import { getConnection, setConnection } from '../../..'

const databaseName = 'deleteMany'

describe('static method deleteMany', () => {
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
			await DeleteManyEntityTestNoDecorator.deleteMany({
				name: 'john',
			})
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Cannot find DeleteManyEntityTestNoDecorator collection.`
			)
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toEqual(true)
	})

	it('shoud delete with query filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Add 2 users
		await connection.collections.DeleteManyEntityTest.insertMany([
			new DeleteManyEntityTest('john@doe.fr'),
			new DeleteManyEntityTest('donald@trump.usa'),
		])

		// Delete donald
		await DeleteManyEntityTest.deleteMany<DeleteManyEntityTest>({
			email: 'donald@trump.usa',
		})

		// Search for Donald
		const donald = await connection.collections.DeleteManyEntityTest.findOne({
			email: 'donald@trump.usa',
		})

		expect(donald).toEqual(null)
	})

	it('should delete all if no query filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Add 2 users
		await connection.collections.DeleteManyEntityTest.insertMany([
			new DeleteManyEntityTest('john@doe.fr'),
			new DeleteManyEntityTest('donald@trump.usa'),
		])

		// Delete all users
		await DeleteManyEntityTest.deleteMany()
		const countUser = await connection.collections.DeleteManyEntityTest.countDocuments()

		expect(countUser).toEqual(0)
	})
})
