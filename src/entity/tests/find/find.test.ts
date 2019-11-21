import { LegatoConnection } from '../../../connection'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import {
	FindEntityTestWithoutDecorator,
	FindEntityTest,
} from './entities/Find.entity.test'
import { getConnection, setConnection } from '../../..'

const databaseName = 'findTest'

describe('static method find', () => {
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
			await FindEntityTestWithoutDecorator.find<FindEntityTestWithoutDecorator>(
				{ name: 'john' }
			)
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toEqual(true)
	})

	it('should find one element using filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert users with mongodb native lib
		await connection.collections.FindEntityTest.insertOne(
			new FindEntityTest('john')
		)

		const users = await FindEntityTest.find<FindEntityTest>({
			name: 'john',
		})

		expect(users.length()).toEqual(1)

		const copy = users.items[0].getCopy()

		expect(copy).toStrictEqual({
			_id: users.items[0]._id,
			name: 'john',
		})
	})

	it('should find all with empty filter', async () => {
		const obj1 = new FindEntityTest('john')
		const obj2 = new FindEntityTest('john doe')

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert users with mongodb native lib
		await connection.collections.FindEntityTest.insertOne(obj1)
		await connection.collections.FindEntityTest.insertOne(obj2)

		const objs = await FindEntityTest.find<FindEntityTest>({})

		expect(objs.length()).toEqual(2)
		expect(objs.items.length).toEqual(2)
	})

	it('should not find and return emtpy array', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = new FindEntityTest('john')

		await connection.collections.FindEntityTest.insertOne(obj)

		const objs = await FindEntityTest.find<FindEntityTest>({ name: 'doe' })

		expect(objs.length()).toEqual(0)
		expect(objs.items.length).toEqual(0)
	})
})
