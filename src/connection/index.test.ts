import {
	createConnectionString,
	MongORMConnection,
	generateCollectionName,
} from '.'
import { errors } from '../messages.const'

describe('createConnectionString function', () => {
	test('must return a valid connection string with all parameters', () => {
		const url = createConnectionString({
			username: 'damien',
			password: 'toto',
			host: 'localhost',
			port: 8080,
			databaseName: 'toto',
		})

		expect(url).toEqual('mongodb://damien:toto@localhost:8080/toto')
	})

	test(`must return a valid connection string with just database name set`, () => {
		const url = createConnectionString({
			databaseName: 'toto',
		})

		expect(url).toEqual(`mongodb://localhost:27017/toto`)
	})
})

describe('generateCollectionName function', () => {
	test('must return a valid collection name', () => {
		class User {}

		const collectionName = generateCollectionName(new User())
		expect(collectionName).toEqual('user')
	})
})

describe('connect function', () => {
	test('must connect to mongo', async () => {
		const mongORM = new MongORMConnection({
			databaseName: 'toto',
		})
		await mongORM.connect()

		expect(mongORM.collections).toBe({})
	})
})

describe('disconnect function', () => {
	test('must throw an error if not connected', async () => {
		const mongORM = new MongORMConnection({
			databaseName: 'toto',
		})

		let hasError = false

		try {
			await mongORM.disconnect()
		} catch (error) {
			expect(error.message).toEqual(
				errors.CLIENT_NOT_CONNECTED_CANNOT_DISCONNECT
			)
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	test('must set connected to false after called', async () => {
		const mongORM = new MongORMConnection({
			databaseName: 'toto',
		})

		await mongORM.connect()
		await mongORM.disconnect()

		expect(mongORM.collections).toEqual({})
	})
})

describe('createIndexesObject function', () => {
	it('should return an array of collections name', () => {
		const metas: Array<{
			obj: Object
			key: string
			unique: boolean
		}> = []
	})
})
