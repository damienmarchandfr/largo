import { createConnectionString, LegatoConnection } from '..'
import { getConnection, setConnection } from '../../index'
import {
	LegatoErrorNotConnected,
	LegatoErrorCannotDisconnect,
} from '../../errors'
import {
	ConnectionTestModel,
	ConnectionTestModel2,
} from './Connection.entity.test'

const databaseName = 'connectiontest'

describe('createConnectionString function', () => {
	it('must return a valid connection string with all parameters', () => {
		const url = createConnectionString({
			username: 'username',
			password: 'password',
			host: 'localhost',
			port: 8080,
			databaseName,
		})

		expect(url).toEqual(
			'mongodb://username:password@localhost:8080/' + databaseName
		)
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
		const legato = new LegatoConnection({
			databaseName,
		})
		await legato.connect()

		expect(legato.collections.ConnectionTestModel).toBeDefined()
		expect(legato.collections.ConnectionTestModel2).toBeDefined()
	})

	it('must return same connection if already connected', async () => {
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
		const connection = new LegatoConnection({
			databaseName,
		})

		await connection.connect()
		const indexes = await connection.collections.ConnectionTestModel.listIndexes().toArray()
		expect(indexes[1].key.id).toEqual(1)
	})

	it('must clean collections if clean = true', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect()

		expect(connection.collections.ConnectionTestModel).toBeDefined()

		await connection.collections.ConnectionTestModel.insertOne(
			new ConnectionTestModel()
		)

		setConnection(null)

		// Create new connection with clean = true
		const secondConnection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})
		expect(secondConnection.collections.ConnectionTestModel).toBeDefined()

		const count = await secondConnection.collections.ConnectionTestModel.countDocuments()
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
		const connection = new LegatoConnection({
			databaseName,
		})

		let hasError = false

		try {
			await connection.disconnect()
		} catch (error) {
			expect(error).toBeInstanceOf(LegatoErrorCannotDisconnect)
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('must accept disconnect after a connection', async () => {
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
			expect(error).toBeInstanceOf(LegatoErrorNotConnected)
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('should clean all collections', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect()

		await connection.collections.ConnectionTestModel.insertMany([
			new ConnectionTestModel(),
			new ConnectionTestModel(),
		])

		await connection.collections.ConnectionTestModel2.insertMany([
			new ConnectionTestModel2(),
			new ConnectionTestModel2(),
		])

		await connection.clean()

		let count = await connection.collections.ConnectionTestModel.countDocuments()
		expect(count).toEqual(0)
		count = await connection.collections.ConnectionTestModel2.countDocuments()
		expect(count).toEqual(0)
	})
})

describe('checkCollectionExists function', () => {
	beforeEach(() => {
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

		const exists = connection.checkCollectionExists('ThisNameWillNeverBeUsed')
		expect(exists).toEqual(false)
	})

	it('should return true if collection exists', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		const exists = connection.checkCollectionExists('ConnectionTestModel')

		expect(exists).toEqual(true)
	})
})
