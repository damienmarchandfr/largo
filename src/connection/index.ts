import { Db, MongoClient, Collection } from 'mongodb'
import { mongODMetaDataStorage } from '..'
import { errors } from '../messages.const'
import { pick } from 'lodash'
import format from 'string-template'

// MongoDB databases protected
const protectedCDatabaseNames = ['admin', 'local', 'config']

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
 * const connection = await new MongODMConnection({databaseName : 'dbName' }).connect({clean : false})
 */
export class MongODMConnection {
	// Native Mongo collections
	public collections: {
		[key: string]: Collection
	}

	private mongoClient: MongoClient | null
	private options: ConnectionOptions
	private db: Db | null

	constructor(options: ConnectionOptions) {
		// Check if database name is not protected
		if (protectedCDatabaseNames.includes(options.databaseName)) {
			throw new Error(
				format(errors.DATABASE_NAME_PROTECTED, {
					databaseName: options.databaseName,
				})
			)
		}

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

	/**
	 * Connect to database and create collections / indexes / validations
	 * @param options
	 */
	public async connect(
		options: ConnectOptions = { clean: false }
	): Promise<MongODMConnection> {
		// Check if already connected
		if (this.mongoClient) {
			throw new Error(errors.ALREADY_CONNECTED)
		}

		const url = createConnectionString(this.options)
		this.mongoClient = await MongoClient.connect(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
		this.db = this.mongoClient.db(this.options.databaseName)

		// Sync collections
		let collectionNames = Object.keys(mongODMetaDataStorage().mongODMFieldMetas)

		// Create collections if not exist
		for (const collectionName of collectionNames) {
			// validator with JSON Schema
			let validator = {}

			if (mongODMetaDataStorage().mongODMValidationMetas[collectionName]) {
				validator = {
					$jsonSchema: {
						bsonType: 'object',
						required:
							mongODMetaDataStorage().mongODMValidationMetas[collectionName]
								.required || [],
						properties:
							mongODMetaDataStorage().mongODMValidationMetas[collectionName]
								.properties || {},
					},
				}
			}

			const collectionCreated = await this.db.createCollection(collectionName, {
				validator,
			})
			this.collections[collectionName] = collectionCreated
		}

		collectionNames = Object.keys(mongODMetaDataStorage().mongODMIndexMetas)

		for (const collectionName of collectionNames) {
			if (!this.collections[collectionName]) {
				const collectionCreated = await this.db.createCollection(collectionName)
				this.collections[collectionName] = collectionCreated
			}
			await this.collections[collectionName].dropIndexes()
			const collectionIndexMetas = mongODMetaDataStorage().mongODMIndexMetas[
				collectionName
			]
			for (const indexMeta of collectionIndexMetas) {
				await this.collections[collectionName].createIndex(indexMeta.key, {
					unique: indexMeta.unique,
				})
			}
		}

		if (options.clean) {
			for (const collectionName of Object.keys(this.collections)) {
				await this.collections[collectionName].deleteMany({})
			}
		}

		return this
	}

	/**
	 * Close connection to MongoDB
	 */
	public async disconnect() {
		if (!this.mongoClient) {
			throw new Error(errors.CLIENT_NOT_CONNECTED_CANNOT_DISCONNECT)
		}
		await this.mongoClient.close()
		this.mongoClient = null
		this.db = null
		this.collections = {}
	}

	/**
	 * Clean all collections
	 */
	public async clean() {
		if (!this.mongoClient) {
			throw new Error(errors.NOT_CONNECTED)
		}
		const collectionNames = Object.keys(this.collections)

		for (const collectionName of collectionNames) {
			await this.collections[collectionName].deleteMany({})
		}
	}
}

export function getMongODMPartial(
	obj: Object,
	collectionName: string
): Partial<Object> {
	// Select fields and indexes
	const fieldKeys =
		mongODMetaDataStorage().mongODMFieldMetas[collectionName] || []

	let indexKeys: string[] = []
	if (mongODMetaDataStorage().mongODMIndexMetas[collectionName]) {
		indexKeys = mongODMetaDataStorage().mongODMIndexMetas[collectionName].map(
			(indexMeta) => {
				return indexMeta.key
			}
		)
	}

	let relationKeys: string[] = []
	if (mongODMetaDataStorage().mongODMRelationsMetas[collectionName]) {
		relationKeys = mongODMetaDataStorage().mongODMRelationsMetas[
			collectionName
		].map((relationMeta) => {
			return relationMeta.key
		})
	}

	return pick(obj, fieldKeys.concat(indexKeys).concat(relationKeys))
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

	return `mongodb://${userAuthURL}${options.host ||
		`localhost`}:${options.port || 27017}/${options.databaseName}`
}
