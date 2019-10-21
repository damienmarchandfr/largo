import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	FindOneOptions,
} from 'mongodb'
import { Subject } from 'rxjs'
import { LegatoMetaDataStorage, getConnection } from '..'
import { difference } from 'lodash'
import { LegatoEntityArray } from '../entityArray'
import { getLegatoPartial } from '../helpers'
import { LegatoErrorOneToOneDeleteParent } from '../errors/delete/OneToOneDeleteParent.error'
import {
	LegatoErrorNotConnected,
	LegatoErrorCollectionDoesNotExist,
	LegatoErrorObjectAlreadyInserted,
} from '../errors'

export class LegatoEntity {
	/**
	 * Get MongoDB collection name for the current class
	 */
	static getCollectionName() {
		return this.name
	}

	static async find<T extends LegatoEntity>(
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	): Promise<LegatoEntityArray<T>> {
		const collectionName = this.getCollectionName()
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(collectionName)
		}

		const cursor = await connection.collections[collectionName].find(
			filter,
			findOptions
		)

		const mongoElements = await cursor.toArray()
		const results = new LegatoEntityArray()

		for (const mongoElement of mongoElements) {
			const object = new this()
			Object.assign(object, mongoElement)
			object.copy = object.toPlainObj()
			results.push(object)
		}

		return results as LegatoEntityArray<T>
	}

	static async findOne<T extends LegatoEntity>(
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	): Promise<T | null> {
		const collectionName = this.getCollectionName()
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(collectionName)
		}

		const mongoElement = await connection.collections[collectionName].findOne(
			filter,
			findOptions
		)

		if (!mongoElement) {
			return null
		}

		const object = new this() as T
		Object.assign(object, mongoElement)
		object.copy = object.toPlainObj()

		return object
	}

	static async updateMany<T extends LegatoEntity>(
		partial: Partial<T>,
		filter: FilterQuery<any> = {},
		options?: UpdateOneOptions
	) {
		const collectionName = this.getCollectionName()
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(collectionName)
		}

		// Filter properties
		const toUpdate = getLegatoPartial(partial, collectionName)

		// TODO If relations are updated check relations

		delete toUpdate._id

		return connection.collections[collectionName].updateMany(
			filter,
			{
				$set: toUpdate,
			},
			options
		)
	}

	static async deleteMany<T extends LegatoEntity>(filter: FilterQuery<T> = {}) {
		const collectionName = this.getCollectionName()
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(collectionName)
		}

		// TODO : check if not linked to others

		return connection.collections[collectionName].deleteMany(filter)
	}

	static async countDocuments(filter: FilterQuery<any> = {}) {
		const collectionName = this.getCollectionName()
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(collectionName)
		}

		return connection.collections[collectionName].countDocuments(filter)
	}

	public _id?: ObjectID

	private events: {
		beforeInsert: Subject<any> // Values to insert
		afterInsert: Subject<any> // Values inserted
		beforeUpdate: Subject<{
			oldValue: any // Values before update
			toUpdate: any // New values to set
		}>
		afterUpdate: Subject<{
			oldValue: any // Values before update
			newValue: any // Values after update
		}>
		beforeDelete: Subject<any>
		afterDelete: Subject<any>
	}

	// Used to check if relations are changed
	private copy: any
	private collectionName: string

	constructor() {
		this.events = {
			beforeInsert: new Subject(),
			afterInsert: new Subject(),
			beforeUpdate: new Subject(),
			afterUpdate: new Subject(),
			beforeDelete: new Subject(),
			afterDelete: new Subject(),
		}
		this.collectionName = this.getCollectionName()
		this.copy = this.toPlainObj()
	}

	beforeInsert<T extends LegatoEntity>() {
		return this.events.beforeInsert as Subject<T>
	}

	afterInsert<T extends LegatoEntity>() {
		return this.events.afterInsert as Subject<T>
	}

	beforeUpdate<T extends LegatoEntity>() {
		return (this.events.beforeUpdate as unknown) as Subject<{
			beforeUpdate: T
			toUpdate: any
		}>
	}

	beforeDelete<T extends LegatoEntity>() {
		return this.events.beforeDelete as Subject<T>
	}

	afterDelete<T extends LegatoEntity>() {
		return this.events.afterDelete as Subject<T>
	}

	afterUpdate<T extends LegatoEntity>() {
		return this.events.afterUpdate as Subject<{
			oldValue: T
			newValue: T
		}>
	}

	/**
	 * Get MongoDB collection name for the current object
	 */
	getCollectionName(): string {
		return this.constructor.name
	}

	toPlainObj() {
		const obj = Object.assign({}, this)
		delete obj.events
		delete obj.copy
		delete obj.collectionName
		return obj
	}

	getCopy() {
		return this.copy
	}

	/**
	 * Insert in database
	 * @param connect
	 */
	async insert() {
		if (this._id) {
			throw new LegatoErrorObjectAlreadyInserted(this)
		}

		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(this.collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this.collectionName)
		}

		const toInsert = getLegatoPartial<this>(this, this.collectionName)

		this.events.beforeInsert.next(this)

		// Check if all relations works
		const relations = LegatoMetaDataStorage().LegatoRelationsMetas[
			this.collectionName
		]

		if (relations) {
			for (const relation of relations) {
				if ((this as any)[relation.key]) {
					const relationCollectioName = relation.targetType.name

					// Relation with multiple elements
					if (Array.isArray((this as any)[relation.key])) {
						const relationQueryResults = await connection.collections[
							relationCollectioName
						]
							.find({
								[relation.targetKey]: {
									$in: (this as any)[relation.key],
								},
							})
							.toArray()

						if (
							relationQueryResults.length !== (this as any)[relation.key].length
						) {
							const resultIds = relationQueryResults.map((result) => {
								return result._id
							})
							const relationIds = (this as any)[relation.key]

							const resultIdsString = (resultIds as ObjectID[]).map((id) => {
								return id.toHexString()
							})
							const relationIdsString = (relationIds as ObjectID[]).map(
								(id) => {
									return id.toHexString()
								}
							)

							const diff = difference(relationIdsString, resultIdsString).map(
								(idString) => {
									return new ObjectID(idString)
								}
							)

							throw new Error()
						}
					} else {
						// Relation with one element
						const relationQueryResult = await connection.collections[
							relationCollectioName
						].findOne({
							[relation.targetKey]: (this as any)[relation.key],
						})

						if (!relationQueryResult) {
							throw new Error()
						}
					}
				}
			}
		}

		const inserted = await connection.collections[
			this.collectionName
		].insertOne(toInsert)
		this._id = inserted.insertedId
		this.copy = this.toPlainObj()

		this.events.afterInsert.next(this)

		return this._id
	}

	/**
	 * Update current object
	 * @param connect
	 * @param options
	 */
	async update(options?: UpdateOneOptions) {
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(this.collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this.collectionName)
		}

		const toUpdate = getLegatoPartial(this, this.collectionName)

		// Search old values
		const savedVersion = await connection.collections[
			this.collectionName
		].findOne({
			_id: this._id,
		})

		this.events.beforeUpdate.next({
			oldValue: savedVersion,
			toUpdate,
		})

		await connection.collections[this.collectionName].updateOne(
			{ _id: this._id },
			{
				$set: toUpdate,
			},
			options || undefined
		)

		Object.assign(this.copy, this)

		const saved = await connection.collections[this.collectionName].findOne({
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
	async delete() {
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(this.collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this.collectionName)
		}

		this.events.beforeDelete.next(this)

		// Check if has relations to other objects in db
		// Check if all relations works
		const relations = LegatoMetaDataStorage().LegatoRelationsMetas[
			this.collectionName
		]

		if (relations) {
			for (const relation of relations) {
				if ((this as any)[relation.key]) {
					const relationCollectioName = relation.targetType.name

					// Relation with multiple elements
					if (Array.isArray((this as any)[relation.key])) {
						const relationQueryResults = await connection.collections[
							relationCollectioName
						]
							.find({
								[relation.targetKey]: {
									$in: (this as any)[relation.key],
								},
							})
							.toArray()

						if (
							relationQueryResults.length !== (this as any)[relation.key].length
						) {
							const resultIds = relationQueryResults.map((result) => {
								return result._id
							})
							const relationIds = (this as any)[relation.key]

							const resultIdsString = (resultIds as ObjectID[]).map((id) => {
								return id.toHexString()
							})
							const relationIdsString = (relationIds as ObjectID[]).map(
								(id) => {
									return id.toHexString()
								}
							)

							const diff = difference(relationIdsString, resultIdsString).map(
								(idString) => {
									return new ObjectID(idString)
								}
							)

							if (diff.length) {
								// Get first child not found
								const relationQueryResult = await connection.collections[
									relationCollectioName
								].findOne({
									[relation.targetKey]: diff[0],
								})
								const object = new (this as any).constructor()
								Object.assign(object, relationQueryResult)

								throw new LegatoErrorOneToOneDeleteParent(this, object)
							}
						}
					} else {
						// Relation with one element
						const relationQueryResult = await connection.collections[
							relationCollectioName
						].findOne({
							[relation.targetKey]: (this as any)[relation.key],
						})

						const object = new relation.targetType()
						delete object.events
						Object.assign(object, relationQueryResult)

						// console.log(this)
						// console.log(object)

						throw new LegatoErrorOneToOneDeleteParent(this, object)
					}
				}
			}
		}

		await connection.collections[this.collectionName].deleteOne({
			_id: this._id,
		})
		this.events.afterDelete.next(this)
	}

	async populate(): Promise<any> {
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(this.collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this.collectionName)
		}

		const relationMetas = LegatoMetaDataStorage().LegatoRelationsMetas[
			this.collectionName
		]

		const pipeline: any[] = [
			{
				$match: {
					_id: this._id,
				},
			},
		]

		if (relationMetas) {
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
		}

		const mongoObj = await connection.collections[this.collectionName]
			.aggregate(pipeline)
			.next()

		return mongoObj as any
	}
}
