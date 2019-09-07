import {
	createConnectionString,
	generateCollectionName,
	generateCollectionNameForStatic,
	MongORMConnection,
} from '.'
import { MongORMField } from '../decorators/field.decorator'
import { errors } from '../messages.const'
import { exportAllDeclaration } from '@babel/types'

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

describe('generateCollectionNameForStatic function', () => {
	test('must return a valid collection name for static', () => {
		class User {
			static test() {
				return this
			}
		}

		const collectionName = generateCollectionNameForStatic(User.test())
		expect(collectionName).toEqual('user')
	})
})

describe('connect function', () => {
	test('must have no collections if no models loaded', async () => {
		const mongORM = new MongORMConnection({
			databaseName: 'toto',
		})
		await mongORM.connect()

		expect(mongORM.collections).toStrictEqual({})
	})

	test('must have collections if models loaded', async () => {
		class User {
			@MongORMField()
			field: string

			constructor() {
				this.field = 'toto'
			}
		}

		const mongORM = new MongORMConnection({
			databaseName: 'toto',
		})
		await mongORM.connect()

		expect(mongORM.collections.user).toBeDefined()
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

	it('must disconnect after a connection', async () => {
		class City {
			@MongORMField()
			name: string

			constructor() {
				this.name = 'Aix en Provence'
			}
		}

		const connection = new MongORMConnection({
			databaseName: 'yop',
		})

		await connection.connect()
		expect(connection.collections.city).toBeDefined()

		await connection.disconnect()
		expect(connection.collections).toStrictEqual({})
	})
})
