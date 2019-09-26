import {
	createConnectionString,
	MongODMConnection,
	getMongODMPartial,
} from './connection'
import { MongODMField } from './decorators/field.decorator'
import { MongODMIndex } from './decorators/index.decorator'
import { MongODMEntity } from './entity'
import { errorCode, MongODMConnectionError } from './errors'

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

describe('MongODM class', () => {
	it('should throw an error if database name is protected', () => {
		let hasError = false
		try {
			const connection = new MongODMConnection({
				databaseName: 'admin',
			})
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(`Database name 'admin' is protected.`)
			expect(error.code).toEqual('MONGODM_ERROR_403')
		}

		expect(hasError).toEqual(true)
	})
})

describe('function getCollectionName', () => {
	class User extends MongODMEntity {}
	const user = new User()
	expect(user.getCollectionName()).toEqual('user')
})

describe('static function getCollectionName', () => {
	class User extends MongODMEntity {}
	expect(User.getCollectionName()).toEqual('user')
})

describe('connect function', () => {
	it('must have collections if models loaded', async () => {
		class ConnexionUser extends MongODMEntity {
			@MongODMField()
			field: string

			constructor() {
				super()
				this.field = 'toto'
			}
		}

		const mongODM = new MongODMConnection({
			databaseName,
		})
		await mongODM.connect()

		expect(mongODM.collections.connexionuser).toBeDefined()
	})

	it('must throw error if already connected', async () => {
		const connection = new MongODMConnection({
			databaseName,
		})

		await connection.connect()

		let hasError = false

		try {
			await connection.connect()
		} catch (error) {
			expect(error.message).toEqual(`Already connected to Mongo database.`)
			expect(error.code).toEqual('MONGODM_ERROR_500')
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('must create index', async () => {
		class Indexed extends MongODMEntity {
			@MongODMIndex({
				unique: false,
			})
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = new MongODMConnection({
			databaseName,
		})

		await connection.connect()

		const indexes = await connection.collections.indexed.listIndexes().toArray()
		expect(indexes[1].key.firstname).toEqual(1)
	})

	it('must clean collections if clean = true', async () => {
		class Cleaned extends MongODMEntity {
			@MongODMField()
			field: string

			constructor() {
				super()
				this.field = 'value'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect()

		expect(connection.collections.cleaned).toBeDefined()

		await connection.collections.cleaned.insertOne(new Cleaned())

		// Create new connection with clean = true
		const secondConnection = await new MongODMConnection({
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
	it('must throw an error if not connected', async () => {
		const mongODM = new MongODMConnection({
			databaseName,
		})

		let hasError = false

		try {
			await mongODM.disconnect()
		} catch (error) {
			expect(error.message).toEqual(
				'Mongo client not conected. You cannot disconnect.'
			)
			expect(error.code).toEqual('MONGODM_ERROR_500')
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('must accept disconnect after a connection', async () => {
		class City extends MongODMEntity {
			@MongODMField()
			name: string

			constructor() {
				super()
				this.name = 'Aix en Provence'
			}
		}

		const connection = new MongODMConnection({
			databaseName,
		})

		await connection.connect()
		expect(connection.collections.city).toBeDefined()

		await connection.disconnect()
		expect(connection.collections).toStrictEqual({})
	})
})

describe('clean function', () => {
	it('must throw error if not connected', async () => {
		const connection = new MongODMConnection({
			databaseName,
		})

		let hasError = false

		try {
			await connection.clean()
		} catch (error) {
			expect(error.message).toEqual(
				`You are not connected to a Mongo database.`
			)
			expect(error.code).toEqual('MONGODM_ERROR_500')
			hasError = true
		}

		expect(hasError).toBe(true)
	})

	it('should clean all collections', async () => {
		class User extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		class Job extends MongODMEntity {
			@MongODMField()
			name: string

			constructor() {
				super()
				this.name = 'clown'
			}
		}

		const connection = await new MongODMConnection({
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

describe('getMongODMPartial function', () => {
	it('should not return field without decorator', () => {
		class Full extends MongODMEntity {
			@MongODMIndex({
				unique: false,
			})
			firstname: string

			@MongODMField()
			lastname: string

			age: number

			constructor() {
				super()
				this.firstname = 'Damien'
				this.lastname = 'Marchand'
				this.age = 18
			}
		}

		const partial = getMongODMPartial(new Full(), 'full')

		expect(partial).toStrictEqual({
			lastname: 'Marchand',
			firstname: 'Damien',
		})
	})

	it('should not return empty field', () => {
		class Full extends MongODMEntity {
			@MongODMField()
			firstname: string

			@MongODMField()
			age?: number

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const partial = getMongODMPartial(new Full(), 'full')

		expect(partial).toStrictEqual({
			firstname: 'Damien',
		})
	})
})

describe('checkCollectionExists function', () => {
	it('should return false if connection does not exist', async () => {
		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		const exists = connection.checkCollectionExists('user123NeverUsed')

		expect(exists).toEqual(false)
	})

	it('should return true if collection exists', async () => {
		class User extends MongODMEntity {
			@MongODMField()
			firstname: string

			constructor() {
				super()
				this.firstname = 'Damien'
			}
		}

		const connection = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		const exists = connection.checkCollectionExists('user')

		expect(exists).toEqual(true)
	})
})
