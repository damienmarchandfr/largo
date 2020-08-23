import { LegatoConnection } from '../../../connection'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import {
	FindEntityTestWithoutDecorator,
	FindEntityTest,
} from './entities/Find.entity.test'
import { getConnection, setConnection } from '../../..'
import { create } from 'lodash'
import { async } from 'rxjs'

const databaseName = 'findTest'

describe('static method find', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	// it('should throw an error if collection does not exist', async () => {
	// 	await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: false,
	// 	})

	// 	let hasError = false

	// 	try {
	// 		await FindEntityTestWithoutDecorator.find<FindEntityTestWithoutDecorator>(
	// 			{}
	// 		)
	// 	} catch (error) {
	// 		hasError = true
	// 		expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
	// 	}

	// 	expect(hasError).toEqual(true)
	// })

	it('should find one element using filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert users with mongodb native lib
		await connection.collections.FindEntityTest.insertMany([
			FindEntityTest.create<FindEntityTest>({ name: 'John' }),
			FindEntityTest.create<FindEntityTest>({}),
		])

		const users = await FindEntityTest.find<FindEntityTest>({
			name: 'John',
		})

		expect(users.length()).toEqual(1)
		console.log(users.items)

		// const copy = users.items[0].getCopy()

		// expect(copy).toStrictEqual({
		// 	_id: users.items[0]._id,
		// 	name: 'John',
		// 	defaultValue: 'value',
		// })
	})

	// it('should find all with empty filter', async () => {
	// 	const obj1 = FindEntityTest.create<FindEntityTest>({ name: 'John' })
	// 	const obj2 = FindEntityTest.create<FindEntityTest>({ name: 'John Doe' })

	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	// Insert users with mongodb native lib
	// 	await connection.collections.FindEntityTest.insertMany([obj1, obj2])

	// 	const objs = await FindEntityTest.find<FindEntityTest>({})

	// 	expect(objs.length()).toEqual(2)
	// 	expect(objs.items.length).toEqual(2)
	// })

	// it('should not find and return emtpy array', async () => {
	// 	const connection = await new LegatoConnection({
	// 		databaseName,
	// 	}).connect({
	// 		clean: true,
	// 	})

	// 	const obj = FindEntityTest.create<FindEntityTest>({ name: 'John' })
	// 	await connection.collections.FindEntityTest.insertOne(obj)

	// 	const objs = await FindEntityTest.find<FindEntityTest>({ name: 'doe' })

	// 	expect(objs.length()).toEqual(0)
	// 	expect(objs.items.length).toEqual(0)
	// })
})
