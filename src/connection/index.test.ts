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

const databaseName = 'connectiontest'

describe('createConnectionString function', () => {
	test('must return a valid connection string with all parameters', () => {
		const url = createConnectionString({
			username: 'damien',
			password: 'toto',
			host: 'localhost',
			port: 8080,
			databaseName,
		})

		expect(url).toEqual('mongodb://damien:toto@localhost:8080/' + databaseName)
	})

	test(`must return a valid connection string with just database name set`, () => {
		const url = createConnectionString({
			databaseName,
		})

		expect(url).toEqual(`mongodb://localhost:27017/${databaseName}`)
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
	test('must have collections if models loaded', async () => {
		class ConnexionUser {
			@MongORMField()
			field: string

			constructor() {
				this.field = 'toto'
			}
		}

		const mongORM = new MongORMConnection({
			databaseName,
		})
		await mongORM.connect()

		expect(
			mongORM.collections[generateCollectionName(new ConnexionUser())]
		).toBeDefined()
	})

	test('must throw error if already connected', async () => {
		const connection = new MongORMConnection({
			databaseName,
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
			databaseName,
		})

		await connection.connect()

		const indexes = await connection.collections.indexed.listIndexes().toArray()
		expect(indexes[1].key.firstname).toEqual(1)
	})

	it('must clean collections if clean = true', async () => {
		class Cleaned {
			@MongORMField()
			field: string

			constructor() {
				this.field = 'value'
			}
		}

		const connection = await new MongORMConnection({
			databaseName,
		}).connect()

		expect(connection.collections.cleaned).toBeDefined()

		await connection.collections.cleaned.insertOne(new Cleaned())

		// Create new connection with clean = true
		const secondConnection = await new MongORMConnection({
			databaseName,
		}).connect({
			clean: true,
		})
		expect(secondConnection.collections.cleaned).toBeDefined()

		const count = await secondConnection.collections.cleaned.countDocuments()
		expect(count).toEqual(0)
	})
})

describe('disconnect function', () => {
	test('must throw an error if not connected', async () => {
		const mongORM = new MongORMConnection({
			databaseName,
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

	it('must accept disconnect after a connection', async () => {
		class City {
			@MongORMField()
			name: string

			constructor() {
				this.name = 'Aix en Provence'
			}
		}

		const connection = new MongORMConnection({
			databaseName,
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
			databaseName,
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
			databaseName,
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

describe('checkCollectionExists function', () => {
	it('should return false if connection does not exist', async () => {
		const connection = await new MongORMConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		const exists = connection.checkCollectionExists('user123NeverUsed')

		expect(exists).toEqual(false)
	})

	it('should return true if collection exists', async () => {
		class User {
			@MongORMField()
			firstname: string

			constructor() {
				this.firstname = 'Damien'
			}
		}

		const connection = await new MongORMConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		const exists = connection.checkCollectionExists('user')

		expect(exists).toEqual(true)
	})
})
