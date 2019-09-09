import {
	createConnectionString,
	generateCollectionName,
	generateCollectionNameForStatic,
	MongORMConnection,
	getMongORMPartial,
} from '.'
import { MongORMField } from '../decorators/field.decorator'
import { errors } from '../messages.const'
import { MongORMIndex } from '../decorators/index.decorator'

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

	test('must throw error if already connected', async () => {
		const connection = new MongORMConnection({
			databaseName: 'already',
		})

		await connection.connect()

		let hasError = false

		try {
			await connection.connect()
		} catch (error) {
			expect(error.message).toEqual(errors.ALREADY_CONNECTED)
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('must create index', async () => {
		class Indexed {
			@MongORMIndex({
				unique: false,
			})
			firstname: string

			constructor() {
				this.firstname = 'Damien'
			}
		}

		const connection = new MongORMConnection({
			databaseName: 'indexed',
		})

		await connection.connect()

		const indexes = await connection.collections.indexed.listIndexes().toArray()
		expect(indexes[1].key.firstname).toEqual(1)
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

describe('clean function', () => {
	test('must throw error if not connected', async () => {
		const connection = new MongORMConnection({
			databaseName: 'clean',
		})

		let hasError = false

		try {
			await connection.clean()
		} catch (error) {
			expect(error.message).toEqual(errors.NOT_CONNECTED)
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	test('should clean all collections', async () => {
		class User {
			@MongORMField()
			firstname: string

			constructor() {
				this.firstname = 'Damien'
			}
		}

		class Job {
			@MongORMField()
			name: string

			constructor() {
				this.name = 'clown'
			}
		}

		const connection = await new MongORMConnection({
			databaseName: 'cleanCollections',
		}).connect()

		await connection.collections.job.insertOne(new Job())
		await connection.collections.user.insertOne(new User())

		await connection.clean()

		// Count all users
		const usersCount = await connection.collections.user.countDocuments()
		expect(usersCount).toEqual(0)

		// Count all jobs
		const jobsCount = await connection.collections.job.countDocuments()
		expect(jobsCount).toEqual(0)
	})
})

describe('getMongORMPartial function', () => {
	it('should not return field without decorator', () => {
		class Full {
			@MongORMIndex({
				unique: false,
			})
			firstname: string

			@MongORMField()
			lastname: string

			age: number

			constructor() {
				this.firstname = 'Damien'
				this.lastname = 'Marchand'
				this.age = 18
			}
		}

		const partial = getMongORMPartial(
			new Full(),
			generateCollectionName(new Full())
		)

		expect(partial).toStrictEqual({
			lastname: 'Marchand',
			firstname: 'Damien',
		})
	})

	it('should not return empty field', () => {
		class Full {
			@MongORMField()
			firstname: string

			@MongORMField()
			age?: number

			constructor() {
				this.firstname = 'Damien'
			}
		}

		const partial = getMongORMPartial(
			new Full(),
			generateCollectionName(new Full())
		)

		expect(partial).toStrictEqual({
			firstname: 'Damien',
		})
	})
})
