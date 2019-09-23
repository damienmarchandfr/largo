import { MongODMConnection, getMongODMPartial } from '../connection'
import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	FindOneOptions,
} from 'mongodb'
import { Subject } from 'rxjs'
import { mongODMetaDataStorage } from '..'
import format from 'string-template'
import { errors } from '../messages.const'

export class MongODMEntityArray<T extends MongODMEntity> {
	private items: T[] = []

	constructor() {
		this.items = []
	}

	push(item: T): T[] {
		this.items.push(item)
		return this.items
	}

	length() {
		return this.items.length
	}

	async populate(connect: MongODMConnection) {
		const collectionName = this.items[0].getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const pipeline: object[] = [
			{ $match: { id: { $in: this.items.map((obj) => obj._id) } } },
		]

		const relationMetas = mongODMetaDataStorage().mongODMRelationsMetas[
			collectionName
		]

		for (const meta of relationMetas) {
			if ((this as any)[meta.key]) {
				if (!Array.isArray((this as any)[meta.key])) {
					pipeline.push({
						$lookup: {
							from: (meta.targetType as any).getCollectionName(),
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
							from: (meta.targetType as any).getCollectionName(),
							localField: meta.key,
							foreignField: meta.targetKey,
							as: meta.populatedKey,
						},
					})
				}
			}
		}

		return connect.collections[collectionName]
			.aggregate(pipeline)
			.next() as Promise<T[]>
	}
}

export class MongODMEntity {
	/**
	 * Get MongoDB collection name for the current class
	 */
	static getCollectionName() {
		return this.name.toLowerCase()
	}

	static async find<T extends MongODMEntity>(
		connect: MongODMConnection,
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	): Promise<MongODMEntityArray<T>> {
		const collectionName = this.getCollectionName()
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
		const results = new MongODMEntityArray()

		for (const mongoElement of mongoElements) {
			const object = new this()
			Object.assign(object, mongoElement)
			results.push(object)
		}

		return results as MongODMEntityArray<T>
	}

	static async findOne<T extends MongODMEntity>(
		connect: MongODMConnection,
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	): Promise<T | null> {
		const collectionName = this.getCollectionName()

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

		const object = new this() as T
		Object.assign(object, mongoElement)

		return object
	}

	static async updateMany<T extends MongODMEntity>(
		connect: MongODMConnection,
		partial: Partial<T>,
		filter: FilterQuery<any> = {},
		options?: UpdateOneOptions
	) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const toUpdate = getMongODMPartial(partial, collectionName)

		return connect.collections[collectionName].updateMany(
			filter,
			{
				$set: toUpdate,
			},
			options
		)
	}

	static async deleteMany<T extends MongODMEntity>(
		connect: MongODMConnection,
		filter: FilterQuery<T> = {}
	) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		return connect.collections[collectionName].deleteMany(filter)
	}

	static async countDocuments(
		connect: MongODMConnection,
		filter: FilterQuery<any> = {}
	) {
		const collectionName = this.getCollectionName()

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
	 * Get MongoDB collection name for the current object
	 */
	getCollectionName(): string {
		return this.constructor.name.toLowerCase()
	}

	/**
	 * Insert in database
	 * @param connect
	 */
	async insert(connect: MongODMConnection) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const toInsert = getMongODMPartial<this>(this, collectionName)

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
	async update(connect: MongODMConnection, options?: UpdateOneOptions) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const toUpdate = getMongODMPartial(this, collectionName)

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
	async delete(connect: MongODMConnection) {
		this.events.beforeDelete.next(this)

		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		await connect.collections[collectionName].deleteOne({ _id: this._id })
		this.events.afterDelete.next(this)
	}

	async populate(connect: MongODMConnection) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new Error(
				format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
			)
		}

		const relationMetas = mongODMetaDataStorage().mongODMRelationsMetas[
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
							from: (meta.targetType as any).getCollectionName(),
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
							from: (meta.targetType as any).getCollectionName(),
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
