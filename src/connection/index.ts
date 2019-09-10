import { Db, MongoClient, Collection } from 'mongodb'
import { mongORMetaDataStorage } from '..'
import { errors } from '../messages.const'
import { pick } from 'lodash'
import { Subject } from 'rxjs'

export interface ConnectionOptions {
	databaseName: string
	username?: string
	password?: string
	host?: string
	port?: number
}

export interface ConnectOptions {
	clean: boolean
}

export class MongORMConnection {
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

	public async connect(
		options: ConnectOptions = { clean: false }
	): Promise<MongORMConnection> {
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
		let collectionNames = Object.keys(mongORMetaDataStorage().mongORMFieldMetas)

		// Create collections if not exist
		for (const collectionName of collectionNames) {
			const collectionCreated = await this.db.createCollection(collectionName)
			this.collections[collectionName] = collectionCreated
		}

		collectionNames = Object.keys(mongORMetaDataStorage().mongORMIndexMetas)

		for (const collectionName of collectionNames) {
			if (!this.collections[collectionName]) {
				const collectionCreated = await this.db.createCollection(collectionName)
				this.collections[collectionName] = collectionCreated
			}
			await this.collections[collectionName].dropIndexes()
			const collectionIndexMetas = mongORMetaDataStorage().mongORMIndexMetas[
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

	public async disconnect() {
		if (!this.mongoClient) {
			throw new Error(errors.CLIENT_NOT_CONNECTED_CANNOT_DISCONNECT)
		}
		await this.mongoClient.close()
		this.mongoClient = null
		this.db = null
		this.collections = {}
	}

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

export function getMongORMPartial(
	obj: Object,
	collectionName: string
): Partial<Object> {
	// Select fields and indexes
	const fieldKeys =
		mongORMetaDataStorage().mongORMFieldMetas[collectionName] || []

	let indexKeys: string[] = []
	if (mongORMetaDataStorage().mongORMIndexMetas[collectionName]) {
		indexKeys = mongORMetaDataStorage().mongORMIndexMetas[collectionName].map(
			(indexMeta) => {
				return indexMeta.key
			}
		)
	}

	return pick(obj, fieldKeys.concat(indexKeys))
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

export function generateCollectionName(object: Object) {
	return object.constructor.name.toLowerCase()
}

export function generateCollectionNameForStatic(object: Object) {
	return object
		.toString()
		.split('(' || /s+/)[0]
		.split(' ' || /s+/)[1]
		.toLowerCase()
}
