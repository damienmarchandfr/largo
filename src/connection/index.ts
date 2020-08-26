import { Db, MongoClient, Collection } from 'mongodb'
import { uniq } from 'lodash'
import { LegatoMetaDataStorage, getConnection, setConnection } from '..'
import { LegatoErrorCannotDisconnect, LegatoErrorNotConnected } from '../errors'

// MongoDB options to create connection
interface ConnectionOptions {
	databaseName: string
	username?: string
	password?: string
	host?: string
	port?: number
}

interface ConnectOptions {
	clean: boolean // Clean all collections
}

/**
 * Use it to connect to MongoDB.
 *
 * const connection = await new LegatoConnection({databaseName : 'dbName' }).connect({clean : false})
 */
export class LegatoConnection {
	// Native Mongo collections
	public collections: {
		[key: string]: Collection
	}

	private mongoClient: MongoClient | null
	private options: ConnectionOptions
	private db: Db | null

	constructor(options: ConnectionOptions) {
		this.options = options
		this.db = null
		this.mongoClient = null
		this.collections = {}
	}

	/**
	 * Check if a mongo collection is created
	 */
	public checkCollectionExists(collectionName: string): boolean {
		return !!this.collections[collectionName]
	}

	public isConnected() {
		return !!this.db
	}

	/**
	 * Connect to database and create collections / indexes / validations
	 */
	public async connect(options: ConnectOptions = { clean: false }) {
		// Check if already connected
		if (getConnection()) {
			return this
		}

		const url = createConnectionString(this.options)
		this.mongoClient = await MongoClient.connect(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		this.db = this.mongoClient.db(this.options.databaseName)

		// Sync collections
		let collectionNames = Object.keys(LegatoMetaDataStorage().LegatoFieldMetas)
			.concat(Object.keys(LegatoMetaDataStorage().LegatoRelationsMetas))
			.concat(Object.keys(LegatoMetaDataStorage().LegatoIndexMetas))

		// Remove duplicate collection name
		collectionNames = uniq(collectionNames)

		const collectionsList = await this.db.listCollections(
			{},
			{ nameOnly: true }
		)
		const collectionsNamesList = (await (await collectionsList.toArray()).map(
			(result) => {
				return result.name
			}
		)) as string[]

		// Create collections
		const createCollectionsPromises = []
		for (const collectionName of collectionNames) {
			if (!collectionsNamesList.includes(collectionName)) {
				createCollectionsPromises.push(
					this.db.createCollection(collectionName).then((collectionCreated) => {
						this.collections[collectionName] = collectionCreated
					})
				)
			} else {
				this.collections[collectionName] = this.db.collection(collectionName)
			}
		}
		await Promise.all(createCollectionsPromises)

		// Create indexes
		collectionNames = Object.keys(LegatoMetaDataStorage().LegatoIndexMetas)

		for (const collectionName of collectionNames) {
			if (!this.collections[collectionName]) {
				const collectionCreated = await this.db.createCollection(collectionName)
				this.collections[collectionName] = collectionCreated
			}
			await this.collections[collectionName].dropIndexes()
			const collectionIndexMetas = LegatoMetaDataStorage().LegatoIndexMetas[
				collectionName
			]
			for (const indexMeta of collectionIndexMetas) {
				const createIndexPromises = []
				createIndexPromises.push(
					this.collections[collectionName].createIndex(indexMeta.key, {
						unique: indexMeta.unique,
					})
				)
				await Promise.all(createIndexPromises)
			}
		}

		if (options.clean) {
			const cleanPromises = []
			for (const collectionName of Object.keys(this.collections)) {
				cleanPromises.push(this.collections[collectionName].deleteMany({}))
			}
			await Promise.all(cleanPromises)
		}

		setConnection(this)

		return this
	}

	/**
	 * Close connection to MongoDB
	 */
	public async disconnect() {
		if (!getConnection()) {
			throw new LegatoErrorCannotDisconnect()
		}
		if (this.mongoClient) {
			await this.mongoClient.close()
		}
		this.mongoClient = null
		this.db = null
		this.collections = {}
		setConnection(null)
	}

	/**
	 * Clean all collections
	 */
	public async clean() {
		if (!getConnection()) {
			throw new LegatoErrorNotConnected()
		}
		const collectionNames = Object.keys(this.collections)

		for (const collectionName of collectionNames) {
			await this.collections[collectionName].deleteMany({})
		}
	}
}

/**
 * Tranform connection options to mongo url
 * @param options
 */
export function createConnectionString(options: ConnectionOptions): string {
	let userAuthURL = ''

	if (options.username && options.password) {
		userAuthURL = `${options.username}:${options.password}@`
	}

	return `mongodb://${userAuthURL}${options.host || `localhost`}:${
		options.port || 27017
	}/${options.databaseName}`
}
