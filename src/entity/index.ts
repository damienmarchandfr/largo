import {
	MongORMConnection,
	generateCollectionName,
	generateCollectionNameForStatic,
	getMongORMPartial,
} from '../connection'
import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	FindOneOptions,
} from 'mongodb'
import { Subject } from 'rxjs'

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
		const toUpdate = getMongORMPartial(partial, collectionName)

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
	static async delete<T>(
		connect: MongORMConnection,
		filter: FilterQuery<T> = {}
	) {
		const collectionName = generateCollectionNameForStatic(this)
		return connect.collections[collectionName].deleteMany(filter)
	}

	static async countDocuments(
		connect: MongORMConnection,
		filter: FilterQuery<any> = {}
	) {
		const collectionName = generateCollectionNameForStatic(this)
		return connect.collections[collectionName].countDocuments(filter)
	}

	public _id?: ObjectID
	public events: {
		beforeInsert: Subject<any>
		afterInsert: Subject<any>
		beforeUpdate: Subject<{
			oldValue: any // Values before update
			partial: any // New values set
		}>
		afterUpdate: Subject<{
			oldValue: any // Values before update
			newValue: any // Values after update
		}>
		beforeDelete: Subject<any>
		afterDelete: Subject<any>
	}

	constructor() {
		this.events = {
			beforeInsert: new Subject(),
			afterInsert: new Subject(),
			beforeUpdate: new Subject(),
			afterUpdate: new Subject(),
			beforeDelete: new Subject(),
			afterDelete: new Subject(),
		}
	}

	/**
	 * Insert in database
	 * @param connect
	 */
	async insert(connect: MongORMConnection) {
		const collectionName = generateCollectionName(this)
		const toInsert = getMongORMPartial(this, collectionName)

		this.events.beforeInsert.next(this)

		const inserted = await connect.collections[collectionName].insertOne(
			toInsert
		)
		this._id = inserted.insertedId

		this.events.afterInsert.next(this)

		return this._id
	}

	/**
	 * Update current object
	 * @param connect
	 * @param options
	 */
	async update(connect: MongORMConnection, options?: UpdateOneOptions) {
		const collectionName = generateCollectionName(this)
		const toUpdate = getMongORMPartial(this, collectionName)

		// Search old values
		const savedVersion = await connect.collections[collectionName].findOne({
			_id: this._id,
		})

		this.events.beforeUpdate.next({
			oldValue: savedVersion,
			partial: toUpdate,
		})

		await connect.collections[collectionName].updateOne(
			{ _id: this._id },
			{
				$set: toUpdate,
			},
			options || undefined
		)

		const saved = await connect.collections[collectionName].findOne({
			_id: this._id,
		})

		this.events.afterUpdate.next({
			oldValue: savedVersion,
			newValue: saved,
		})
	}

	/**
	 * Delete current object
	 * @param connect
	 */
	async delete(connect: MongORMConnection) {
		this.events.beforeDelete.next(this)
		const collectionName = generateCollectionName(this)
		await connect.collections[collectionName].deleteOne({ _id: this._id })
		this.events.afterDelete.next(this)
	}
}
