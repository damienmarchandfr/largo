import { LegatoConnection } from '../connection'
import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	FindOneOptions,
} from 'mongodb'
import { Subject } from 'rxjs'
import { LegatoMetaDataStorage } from '..'
import {
	LegatoCollectionDoesNotExistError,
	LegatoRelationError,
	LegatoAlreadyInsertedError,
	LegatoRelationsError,
} from '../errors'
import { difference } from 'lodash'
import { LegatoEntityArray } from '../entityArray'
import { getLegatoPartial } from '../helpers'

export class LegatoEntity {
	/**
	 * Get MongoDB collection name for the current class
	 */
	static getCollectionName() {
		return this.name.toLowerCase()
	}

	static async find<T extends LegatoEntity>(
		connect: LegatoConnection,
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	): Promise<LegatoEntityArray<T>> {
		const collectionName = this.getCollectionName()
		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
		}

		const cursor = await connect.collections[collectionName].find(
			filter,
			findOptions
		)

		const mongoElements = await cursor.toArray()
		const results = new LegatoEntityArray()

		for (const mongoElement of mongoElements) {
			const object = new this()
			Object.assign(object, mongoElement)
			results.push(object)
		}

		return results as LegatoEntityArray<T>
	}

	static async findOne<T extends LegatoEntity>(
		connect: LegatoConnection,
		filter: FilterQuery<any>,
		findOptions?: FindOneOptions
	): Promise<T | null> {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
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

	static async updateMany<T extends LegatoEntity>(
		connect: LegatoConnection,
		partial: Partial<T>,
		filter: FilterQuery<any> = {},
		options?: UpdateOneOptions
	) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
		}

		const toUpdate = getLegatoPartial(partial, collectionName)

		return connect.collections[collectionName].updateMany(
			filter,
			{
				$set: toUpdate,
			},
			options
		)
	}

	static async deleteMany<T extends LegatoEntity>(
		connect: LegatoConnection,
		filter: FilterQuery<T> = {}
	) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
		}

		return connect.collections[collectionName].deleteMany(filter)
	}

	static async countDocuments(
		connect: LegatoConnection,
		filter: FilterQuery<any> = {}
	) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
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

	// Used to check if relations are changed
	private copy: this

	constructor() {
		this.events = {
			beforeInsert: new Subject(),
			afterInsert: new Subject(),
			beforeUpdate: new Subject(),
			afterUpdate: new Subject(),
			beforeDelete: new Subject(),
			afterDelete: new Subject(),
		}
		this.copy = Object.assign({}, this)
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
	async insert(connect: LegatoConnection) {
		if (this._id) {
			throw new LegatoAlreadyInsertedError(this._id)
		}

		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
		}

		const toInsert = getLegatoPartial<this>(this, collectionName)

		this.events.beforeInsert.next(this)

		// Check if all relations works
		const relations = LegatoMetaDataStorage().LegatoRelationsMetas[
			collectionName
		]

		if (relations) {
			for (const relation of relations) {
				if ((this as any)[relation.key]) {
					const relationCollectioName = relation.targetType.name.toLowerCase()

					// Relation with multiple elements
					if (Array.isArray((this as any)[relation.key])) {
						const relationQueryResults = await connect.collections[
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

							throw new LegatoRelationsError(
								diff,
								this,
								relation.key,
								new relation.targetType(),
								relation.targetKey
							)
						}
					} else {
						// Relation with one element
						const relationQueryResult = await connect.collections[
							relationCollectioName
						].findOne({
							[relation.targetKey]: (this as any)[relation.key],
						})

						if (!relationQueryResult) {
							throw new LegatoRelationError(
								this,
								relation.key,
								new relation.targetType(),
								relation.targetKey
							)
						}
					}
				}
			}
		}

		const inserted = await connect.collections[collectionName].insertOne(
			toInsert
		)
		this._id = inserted.insertedId
		this.copy._id = this._id

		this.events.afterInsert.next(this)

		return this._id
	}

	/**
	 * Update current object
	 * @param connect
	 * @param options
	 */
	async update(connect: LegatoConnection, options?: UpdateOneOptions) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
		}

		const toUpdate = getLegatoPartial(this, collectionName)

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
	async delete(connect: LegatoConnection) {
		this.events.beforeDelete.next(this)

		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
		}

		await connect.collections[collectionName].deleteOne({ _id: this._id })
		this.events.afterDelete.next(this)
	}

	async populate<T extends LegatoEntity>(connect: LegatoConnection) {
		const collectionName = this.getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new LegatoCollectionDoesNotExistError(collectionName)
		}

		const relationMetas = LegatoMetaDataStorage().LegatoRelationsMetas[
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

		return (await connect.collections[collectionName]
			.aggregate(pipeline)
			.next()) as T
	}
}
