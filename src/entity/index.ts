import { MongORMConnection, generateCollectionName } from '../connection'
import { FilterQuery, UpdateOneOptions, ObjectID } from 'mongodb'
import { mongORMetaDataStorage } from '..'
import { pick } from 'lodash'

export class MongORMEntity {
	/**
	 * Update many objects with query filter
	 * @param connect
	 * @param partial
	 * @param filter
	 * @param options
	 */
	static async update(
		connect: MongORMConnection,
		partial: Object,
		filter: FilterQuery<any> = {},
		options?: UpdateOneOptions
	) {
		const collectionName = generateCollectionName(this)

		// Select keys of partial
		const fieldKeys = mongORMetaDataStorage().mongORMFieldMetas[collectionName]
		const indexKeys = mongORMetaDataStorage().mongORMIndexMetas[
			collectionName
		].map((indexMeta) => {
			return indexMeta.key
		})

		const toUpdate = pick(partial, fieldKeys.concat(indexKeys))

		return connect.collections[collectionName].updateMany(
			filter,
			toUpdate,
			options
		)
	}

	/**
	 * Delete objects in a collection. If no filter collection will be cleaned
	 * @param connect
	 * @param filter
	 */
	static async delete(
		connect: MongORMConnection,
		filter: FilterQuery<any> = {}
	) {
		const collectionName = generateCollectionName(this)

		return connect.collections[collectionName].deleteMany(filter)
	}

	public _id: ObjectID | null = null

	/**
	 * Insert in database
	 * @param connect
	 */
	async insert(connect: MongORMConnection) {
		const collectionName = generateCollectionName(this)

		// Select fields and indexes
		const fieldKeys = mongORMetaDataStorage().mongORMFieldMetas[collectionName]
		const indexKeys = mongORMetaDataStorage().mongORMIndexMetas[
			collectionName
		].map((indexMeta) => {
			return indexMeta.key
		})

		const toInsert = pick(this, fieldKeys.concat(indexKeys))

		const inserted = await connect.collections[collectionName].insertOne(
			toInsert
		)
		this._id = inserted.insertedId
		return this._id
	}

	/**
	 * Update current object
	 * @param connect
	 * @param options
	 */
	async update(connect: MongORMConnection, options?: UpdateOneOptions) {
		const collectionName = generateCollectionName(this)

		// Select fields and indexes
		const fieldKeys = mongORMetaDataStorage().mongORMFieldMetas[collectionName]
		const indexKeys = mongORMetaDataStorage().mongORMIndexMetas[
			collectionName
		].map((indexMeta) => {
			return indexMeta.key
		})

		const toUpdate = pick(this, fieldKeys.concat(indexKeys))

		return connect.collections[collectionName].updateOne(
			{ _id: this._id },
			{
				$set: toUpdate,
			},
			options || undefined
		)
	}

	/**
	 * Delete current object
	 * @param connect
	 */
	async delete(connect: MongORMConnection) {
		const collectionName = generateCollectionName(this)
		return connect.collections[collectionName].deleteOne({ _id: this._id })
	}
}
