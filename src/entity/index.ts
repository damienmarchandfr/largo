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
import { mongORMetaDataStorage } from '..'
import format from 'string-template'
import { errors } from '../messages.const'

export class MongORMEntityArray {
	private items: any[] = []

	push(item: any) {
		this.items.push(item)
	}

	length() {
		return this.items.length
	}

	async populate(connect: MongORMConnection) {
		const collectionName = generateCollectionName(this.items[0])

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const pipeline: object[] = [
			{ $match: { id: { $in: this.items.map((obj) => obj._id) } } },
		]

		const relationMetas = mongORMetaDataStorage().mongORMRelationsMetas[
			collectionName
		]

		for (const meta of relationMetas) {
			if ((this as any)[meta.key]) {
				if (!Array.isArray((this as any)[meta.key])) {
					pipeline.push({
						$lookup: {
							from: generateCollectionNameForStatic(meta.targetType),
							localField: meta.key,
							foreignField: meta.targetKey,
							as: meta.populatedKey,
						},
					})

					pipeline.push({
						$unwind: {
							path: '$' + meta.populatedKey,
							// Si la relation ne pointe pas on retourne quand même le document (vérifié  avec le check relation)
							preserveNullAndEmptyArrays: true,
						},
					})
				} else {
					pipeline.push({
						$lookup: {
							from: generateCollectionNameForStatic(meta.targetType),
							localField: meta.key,
							foreignField: meta.targetKey,
							as: meta.populatedKey,
						},
					})
				}
			}
		}

		return connect.collections[collectionName].aggregate(pipeline).next()
	}
}

export class MongORMEntity {
	static async find(
		connect: MongORMConnection,
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	) {
		const collectionName = generateCollectionNameForStatic(this)
		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const cursor = await connect.collections[collectionName].find(
			filter,
			findOptions
		)

		const mongoElements = await cursor.toArray()
		const results = new MongORMEntityArray()

		for (const mongoElement of mongoElements) {
			const object = new this()
			Object.assign(object, mongoElement)
			results.push(object)
		}

		return results
	}

	static async findOne<A extends MongORMEntity>(
		connect: MongORMConnection,
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	): Promise<A | null> {
		const collectionName = generateCollectionNameForStatic(this)

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const mongoElement = await connect.collections[collectionName].findOne(
			filter,
			findOptions
		)

		// If null
		if (!mongoElement) {
			return null
		}

		const object = new this() as A
		Object.assign(object, mongoElement)

		return object
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

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

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

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		return connect.collections[collectionName].deleteMany(filter)
	}

	static async countDocuments(
		connect: MongORMConnection,
		filter: FilterQuery<any> = {}
	) {
		const collectionName = generateCollectionNameForStatic(this)

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

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

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

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

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

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

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		await connect.collections[collectionName].deleteOne({ _id: this._id })
		this.events.afterDelete.next(this)
	}

	async populate(connect: MongORMConnection) {
		const collectionName = generateCollectionName(this)

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const relationMetas = mongORMetaDataStorage().mongORMRelationsMetas[
			collectionName
		]

		const pipeline: any[] = [
			{
				$match: {
					_id: this._id,
				},
			},
		]

		for (const meta of relationMetas) {
			if ((this as any)[meta.key]) {
				if (!Array.isArray((this as any)[meta.key])) {
					pipeline.push({
						$lookup: {
							from: generateCollectionNameForStatic(meta.targetType),
							localField: meta.key,
							foreignField: meta.targetKey,
							as: meta.populatedKey,
						},
					})

					pipeline.push({
						$unwind: {
							path: '$' + meta.populatedKey,
							// Si la relation ne pointe pas on retourne quand même le document (vérifié  avec le check relation)
							preserveNullAndEmptyArrays: true,
						},
					})
				} else {
					pipeline.push({
						$lookup: {
							from: generateCollectionNameForStatic(meta.targetType),
							localField: meta.key,
							foreignField: meta.targetKey,
							as: meta.populatedKey,
						},
					})
				}
			}
		}

		return connect.collections[collectionName].aggregate(pipeline).next()
	}
}
