import { createConnectionString, LegatoConnection } from '.'
import { LegatoField } from '../decorators/field.decorator'
import { LegatoIndex } from '../decorators/index.decorator'
import { LegatoEntity } from '../entity'
import { getConnection, setConnection } from '../index'

const databaseName = 'connectiontest'

describe('createConnectionString function', () => {
	it('must return a valid connection string with all parameters', () => {
		const url = createConnectionString({
			username: 'damien',
			password: 'toto',
			host: 'localhost',
			port: 8080,
			databaseName,
		})

		expect(url).toEqual('mongodb://damien:toto@localhost:8080/' + databaseName)
	})

	it(`must return a valid connection string with just database name set`, () => {
		const url = createConnectionString({
			databaseName,
		})

		expect(url).toEqual(`mongodb://localhost:27017/${databaseName}`)
	})
})

describe('connect function', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('must have collections if models loaded', async () => {
		class ConnectUser extends LegatoEntity {
			@LegatoField()
			field: string

			constructor() {
				super()
				this.field = 'toto'
			}
		}

		const legato = new LegatoConnection({
			databaseName,
		})
		await legato.connect()

		expect(legato.collections.ConnectUser).toBeDefined()
	})

	it('must return same if already connected', async () => {
		const connection = new LegatoConnection({
			databaseName,
		})

		await connection.connect()

		const newConnection = await connection.connect()

		expect(connection).toStrictEqual(newConnection)
	})

	it('must create a reference to connection', async () => {
		setConnection(null)

		const connection = await new LegatoConnection({
			databaseName,
		}).connect()

		expect(getConnection()).toStrictEqual(connection)
	})

	it('must create index', async () => {
		class ConnectIndexed extends LegatoEntity {
			@LegatoIndex({
				unique: false,
			})
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = new LegatoConnection({
			databaseName,
		})

		await connection.connect()
		const indexes = await connection.collections.ConnectIndexed.listIndexes().toArray()
		expect(indexes[1].key.firstname).toEqual(1)
	})

	it('must clean collections if clean = true', async () => {
		class ConnectCleaned extends LegatoEntity {
			@LegatoField()
			field: string

			constructor() {
				super()
				this.field = 'value'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect()

		expect(connection.collections.ConnectCleaned).toBeDefined()

		await connection.collections.ConnectCleaned.insertOne(new ConnectCleaned())

		setConnection(null)

		// Create new connection with clean = true
		const secondConnection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})
		expect(secondConnection.collections.ConnectCleaned).toBeDefined()

		const count = await secondConnection.collections.ConnectCleaned.countDocuments()
		expect(count).toEqual(0)
	})
})

describe('disconnect function', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('must throw an error if not connected', async () => {
		const legato = new LegatoConnection({
			databaseName,
		})

		let hasError = false

		try {
			await legato.disconnect()
		} catch (error) {
			expect(error.message).toEqual(
				'Cannot disconnect cause not connected to MongoDB.'
			)
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('must accept disconnect after a connection', async () => {
		class DisconnectCity extends LegatoEntity {
			@LegatoField()
			name: string

			constructor() {
				super()
				this.name = 'Aix en Provence'
			}
		}

		const connection = new LegatoConnection({
			databaseName,
		})

		await connection.connect()

		await connection.disconnect()
		expect(connection.collections).toStrictEqual({})
	})

	it('must set connection to null', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		await connection.disconnect()

		expect(getConnection()).toEqual(null)
	})
})

describe('clean function', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('must throw error if not connected', async () => {
		const connection = new LegatoConnection({
			databaseName,
		})

		let hasError = false

		try {
			await connection.clean()
		} catch (error) {
			expect(error.message).toEqual(`You are not connected to MongoDB.`)
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('should clean all collections', async () => {
		class CleanUser extends LegatoEntity {
			@LegatoField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		class CleanJob extends LegatoEntity {
			@LegatoField()
			name: string

			constructor() {
				super()
				this.name = 'clown'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect()

		await connection.collections.CleanJob.insertOne(new CleanJob())
		await connection.collections.CleanUser.insertOne(new CleanUser())

		await connection.clean()

		// Count all users
		const usersCount = await connection.collections.CleanUser.countDocuments()
		expect(usersCount).toEqual(0)

		// Count all jobs
		const jobsCount = await connection.collections.CleanJob.countDocuments()
		expect(jobsCount).toEqual(0)
	})
})

describe('checkCollectionExists function', () => {
	beforeEach(() => {
		// If connected then disconnect
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should return false if connection does not exist', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		const exists = connection.checkCollectionExists('user123NeverUsed')

		expect(exists).toEqual(false)
	})

	it('should return true if collection exists', async () => {
		class CheckCollectionExistsUser extends LegatoEntity {
			@LegatoField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		const exists = connection.checkCollectionExists('CheckCollectionExistsUser')

		expect(exists).toEqual(true)
	})
})
