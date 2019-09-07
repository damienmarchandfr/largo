import {
	MongORMConnection,
	generateCollectionName,
	generateCollectionNameForStatic,
} from '../connection'
import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	FindOneOptions,
} from 'mongodb'

export class MongORMEntity {
	static async findOne(
		connect: MongORMConnection,
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	) {
		const collectionName = generateCollectionNameForStatic(this)
		return connect.collections[collectionName].findOne(filter, findOptions)
	}

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
		const collectionName = generateCollectionNameForStatic(this)
		const toUpdate = connect.getMongORMPartial(partial, collectionName)

		return connect.collections[collectionName].updateMany(
			filter,
			{
				$set: toUpdate,
			},
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
		const collectionName = generateCollectionNameForStatic(this)
		return connect.collections[collectionName].deleteMany(filter)
	}

	public _id: ObjectID | null = null

	/**
	 * Insert in database
	 * @param connect
	 */
	async insert(connect: MongORMConnection) {
		const collectionName = generateCollectionName(this)
		const toInsert = connect.getMongORMPartial(this, collectionName)

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
		const toUpdate = connect.getMongORMPartial(this, collectionName)

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
