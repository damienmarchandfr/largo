import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	UpdateManyOptions,
	FindOneOptions,
} from 'mongodb'
import { Subject } from 'rxjs'
import {
	LegatoMetaDataStorage,
	getConnection,
	DataStorageFielRelationValue,
} from '..'
import { difference, filter as f, isEmpty } from 'lodash'
import { LegatoEntityArray } from '../entityArray'
import { getLegatoPartial } from '../helpers'
import {
	LegatoErrorNotConnected,
	LegatoErrorCollectionDoesNotExist,
	LegatoErrorObjectAlreadyInserted,
} from '../errors'
import { LegatoErrorDeleteNoMongoID } from '../errors/delete/NoMongoIdDelete.error'
import { LegatoErrorDeleteChild } from '../errors/delete/DeleteChild.error'
import { LegatoErrorInsertParent } from '../errors/insert/InsertParent.error'
import { LegatoErrorUpdateParent } from '../errors/update/UpdateParent.error'
import { LegatoErrorUpdateManyParent } from '../errors/updateMany/UpdateManyParent.error'

type LegatoPartial<T> = Partial<
	Omit<
		T,
		| '_id'
		| 'beforeDelete'
		| 'afterDelete'
		| 'beforeInsert'
		| 'afterInsert'
		| 'beforeUpdate'
		| 'afterUpdate'
		| 'delete'
		| 'getCollectionName'
		| 'insert'
		| 'update'
		| 'populate'
		| 'toPlainObj'
	>
>

export type LegatoPlain<T> = Partial<
	Omit<
		T,
		| 'beforeDelete'
		| 'afterDelete'
		| 'beforeInsert'
		| 'afterInsert'
		| 'beforeUpdate'
		| 'afterUpdate'
		| 'delete'
		| 'getCollectionName'
		| 'insert'
		| 'update'
		| 'populate'
		| 'toPlainObj'
	>
>

export class LegatoEntity {
	/**
	 * Get MongoDB collection name for the current class
	 */
	static getCollectionName() {
		return this.name
	}

	/**
	 * Get parents and children to check relations
	 */
	static getMetasToCheck(): {
		children: DataStorageFielRelationValue[]
		parents: DataStorageFielRelationValue[]
	} {
		const allMetas = LegatoMetaDataStorage().LegatoRelationsMetas

		const metasToReturn: {
			children: DataStorageFielRelationValue[]
			parents: DataStorageFielRelationValue[]
		} = {
			children: [],
			parents: [],
		}

		for (const key in allMetas) {
			if (allMetas.hasOwnProperty(key)) {
				const metas = allMetas[key]

				// Children
				let metasToAdd = f(metas, (m) => {
					return m.checkRelation === true && m.populatedType.name === this.name
				})
				metasToReturn.children = metasToReturn.children.concat(metasToAdd)

				// Parents
				metasToAdd = f(metas, (m) => {
					return m.checkRelation === true && m.targetType.name === this.name
				})
				metasToReturn.parents = metasToReturn.parents.concat(metasToAdd)
			}
		}

		return metasToReturn
	}

	/**
	 * @description Find multiple element in database
	 * @example await User.find<User>({name : 'John'});
	 * @summary If filter is empty will return all objects saved
	 * @returns Promise<LegatoEntity[]>
	 *
	 * @param filter
	 * @param findOptions
	 */
	static async find<T extends LegatoEntity>(
		filter: FilterQuery<T> = {},
		findOptions: FindOneOptions<any>
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
			const object = this.create<T>(mongoElement)
			results.push(object)
		}

		return results as LegatoEntityArray<T>
	}

	static async findOne<T extends LegatoEntity>(
		filter: FilterQuery<T>,
		findOptions?: FindOneOptions<any>
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

		return this.create<T>(mongoElement)
	}

	static async updateMany<T extends LegatoEntity>(
		filter: FilterQuery<T> = {},
		partial: Partial<T>,
		checkRelations = true,
		options?: UpdateManyOptions
	): Promise<number> {
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

		delete toUpdate._id // MongoID cannot be changed

		if (isEmpty(toUpdate)) {
			return 0
		}

		// Get meta for relation checking
		const metasToCheck = this.getMetasToCheck()

		// Must check relation in database
		if (checkRelations && metasToCheck.children.length) {
			// Get all
			const mongoResult = await connection.collections[collectionName]
				.find(filter)
				.toArray()

			for (const result of mongoResult) {
				for (const meta of metasToCheck.children) {
					// Set new vaules
					Object.assign(result, toUpdate)

					if (result[meta.key]) {
						// Search if element exists in database
						// One to many
						if (Array.isArray(result[meta.key])) {
							const resultOneToMany = await connection.collections[
								meta.targetType.name
							]
								.find({
									[meta.targetKey]: {
										$in: result[meta.key],
									},
								})
								.toArray()

							if (resultOneToMany.length !== result[meta.key].length) {
								// Number of id != number of results from db
								const obj = this.create(result)
								throw new LegatoErrorUpdateManyParent(obj, meta)
							}
						} else {
							// One to one
							const resultOneToOne = await connection.collections[
								meta.targetType.name
							].findOne({
								[meta.targetKey]: result[meta.key],
							})

							if (!resultOneToOne) {
								const obj = this.create(result)
								throw new LegatoErrorUpdateManyParent(obj, meta)
							}
						}
					}
				}
			}
		}

		const updateResult = await connection.collections[
			collectionName
		].updateMany(
			filter,
			{
				$set: toUpdate,
			},
			options
		)

		return updateResult.modifiedCount
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

		// WIP : check if not linked to others as a child
		const relationMetas = this.getMetasToCheck()

		// Must check parents
		if (relationMetas.parents && relationMetas.parents.length) {
			// Search all elements to delete
			const mongoObjects = await connection.collections[collectionName]
				.find(filter)
				.toArray()

			// Element to delete
			const children = mongoObjects.map((mongoElement) => {
				const object = new this()
				Object.assign(object, mongoElement)
				return object
			})

			for (const child of children) {
				for (const relation of relationMetas.parents) {
					if ((child as any)[relation.targetKey]) {
						// Search parent(s) with relation
						const relationCollectionName = relation.populatedType.name

						const parentFilter: any = {}
						parentFilter[relation.key] = (child as any)[relation.targetKey]

						const parents = await connection.collections[relationCollectionName]
							.find(parentFilter)
							.toArray()

						if (parents.length) {
							// Get parent constructor
							const parent = new (relation.populatedType as any)() as LegatoEntity
							Object.assign(parent, parents[0])

							throw new LegatoErrorDeleteChild(parent, child, relation)
						}
					}
				}
			}
		}

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

	private _events: {
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
	private _collectionName: string

	constructor() {
		this._events = {
			beforeInsert: new Subject(),
			afterInsert: new Subject(),
			beforeUpdate: new Subject(),
			afterUpdate: new Subject(),
			beforeDelete: new Subject(),
			afterDelete: new Subject(),
		}
		this._collectionName = this.getCollectionName()
	}

	static create<T extends LegatoEntity>(initialValues?: LegatoPartial<T>) {
		const object = new this() as any

		const connection = getConnection()
		const collectionName = object._collectionName

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(collectionName)
		}

		for (const key in initialValues) {
			if (initialValues.hasOwnProperty(key)) {
				object[key] = (initialValues as any)[key]
			}
		}

		return object as T
	}

	beforeInsert<T extends LegatoEntity>() {
		return this._events.beforeInsert as Subject<T>
	}

	afterInsert<T extends LegatoEntity>() {
		return this._events.afterInsert as Subject<T>
	}

	beforeUpdate<T extends LegatoEntity>() {
		return (this._events.beforeUpdate as unknown) as Subject<{
			oldValue: T
			toUpdate: any
		}>
	}

	afterUpdate<T extends LegatoEntity>() {
		return this._events.afterUpdate as Subject<{
			oldValue: T
			newValue: T
		}>
	}

	beforeDelete<T extends LegatoEntity>() {
		return this._events.beforeDelete as Subject<T>
	}

	afterDelete<T extends LegatoEntity>() {
		return this._events.afterDelete as Subject<T>
	}

	/**
	 * Get MongoDB collection name for the current object
	 */
	getCollectionName(): string {
		return this.constructor.name
	}

	toPlainObj() {
		const obj = Object.assign({}, this) as any
		delete obj._events
		delete obj._copy
		delete obj._collectionName
		return obj as LegatoPlain<this>
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

		if (!connection.checkCollectionExists(this._collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this._collectionName)
		}

		const toInsert = getLegatoPartial<this>(this, this._collectionName)

		this._events.beforeInsert.next(this)

		// Check if all relations works
		const relationsMetas = this.getMetasToCheck()

		if (relationsMetas.children && relationsMetas.children.length) {
			for (const relation of relationsMetas.children) {
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
								return result[relation.targetKey]
							})
							const relationIds = (this as any)[relation.key]

							const resultIdsString = resultIds.map((id) => {
								if (id instanceof ObjectID) {
									return id.toHexString()
								}
								return id
							})
							const relationIdsString = (relationIds as any[]).map((id) => {
								if (id instanceof ObjectID) {
									return id.toHexString()
								}
								return id
							})

							const diff = difference(relationIdsString, resultIdsString).map(
								(id) => {
									if (id instanceof ObjectID) {
										return id.toHexString()
									}
									return id
								}
							)

							if (diff.length) {
								throw new LegatoErrorInsertParent(this, relation)
							}
						}
					} else {
						// Relation with one element
						const relationQueryResult = await connection.collections[
							relationCollectioName
						].findOne({
							[relation.targetKey]: (this as any)[relation.key],
						})

						if (!relationQueryResult) {
							throw new LegatoErrorInsertParent(this, relation)
						}
					}
				}
			}
		}

		const inserted = await connection.collections[
			this._collectionName
		].insertOne(toInsert)
		this._id = inserted.insertedId as ObjectID

		this._events.afterInsert.next(this)

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

		if (!connection.checkCollectionExists(this._collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this._collectionName)
		}

		const toUpdate = getLegatoPartial(this, this._collectionName)

		if (isEmpty(toUpdate)) {
			return
		}

		// Search old values
		const savedVersion = await connection.collections[
			this._collectionName
		].findOne({
			_id: this._id,
		})

		this._events.beforeUpdate.next({
			oldValue: savedVersion,
			toUpdate,
		})

		// Check relations
		const relationsMetas = this.getMetasToCheck()

		if (relationsMetas.children && relationsMetas.children.length) {
			for (const relation of relationsMetas.children) {
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
								return result[relation.targetKey]
							})
							const relationIds = (this as any)[relation.key]

							const resultIdsString = resultIds.map((id) => {
								if (id instanceof ObjectID) {
									return id.toHexString()
								}
								return id
							})
							const relationIdsString = (relationIds as any[]).map((id) => {
								if (id instanceof ObjectID) {
									return id.toHexString()
								}
								return id
							})

							const diff = difference(relationIdsString, resultIdsString).map(
								(id) => {
									if (id instanceof ObjectID) {
										return id.toHexString()
									}
									return id
								}
							)

							if (diff.length) {
								throw new LegatoErrorUpdateParent(this, relation)
							}
						}
					} else {
						// Relation with one element
						const relationQueryResult = await connection.collections[
							relationCollectioName
						].findOne({
							[relation.targetKey]: (this as any)[relation.key],
						})

						if (!relationQueryResult) {
							throw new LegatoErrorUpdateParent(this, relation)
						}
					}
				}
			}
		}

		await connection.collections[this._collectionName].updateOne(
			{ _id: this._id },
			{
				$set: toUpdate,
			},
			options || undefined
		)

		const saved = await connection.collections[this._collectionName].findOne({
			_id: this._id,
		})

		this._events.afterUpdate.next({
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

		if (!connection.checkCollectionExists(this._collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this._collectionName)
		}

		if (!this._id) {
			throw new LegatoErrorDeleteNoMongoID(this)
		}

		this._events.beforeDelete.next(this)

		const relationMetas = this.getMetasToCheck()

		// Parents
		if (relationMetas.parents.length) {
			for (const relation of relationMetas.parents) {
				if ((this as any)[relation.targetKey]) {
					// Search parent(s) with relation
					const relationCollectionName = relation.populatedType.name

					const filter: any = {}
					filter[relation.key] = (this as any)[relation.targetKey]

					const parents = await connection.collections[relationCollectionName]
						.find(filter)
						.toArray()

					if (parents.length) {
						// Get parent constructor
						const parent = new (relation.populatedType as any)() as LegatoEntity
						Object.assign(parent, parents[0])

						throw new LegatoErrorDeleteChild(parent, this, relation)
					}
				}
			}
		}

		await connection.collections[this._collectionName].deleteOne({
			_id: this._id,
		})
		this._events.afterDelete.next(this)
	}

	async populate(): Promise<any> {
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		if (!connection.checkCollectionExists(this._collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(this._collectionName)
		}

		const relationMetas = LegatoMetaDataStorage().LegatoRelationsMetas[
			this._collectionName
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

		const mongoObj = await connection.collections[this._collectionName]
			.aggregate(pipeline)
			.next()

		return mongoObj as any
	}

	private getMetasToCheck(): {
		children: DataStorageFielRelationValue[]
		parents: DataStorageFielRelationValue[]
	} {
		const allMetas = LegatoMetaDataStorage().LegatoRelationsMetas

		const metasToReturn: {
			children: DataStorageFielRelationValue[]
			parents: DataStorageFielRelationValue[]
		} = {
			children: [],
			parents: [],
		}

		for (const key in allMetas) {
			if (allMetas.hasOwnProperty(key)) {
				const metas = allMetas[key]

				// Children
				let metasToAdd = f(metas, (m) => {
					return (
						m.checkRelation === true &&
						m.populatedType.name === this.getCollectionName()
					)
				})
				metasToReturn.children = metasToReturn.children.concat(metasToAdd)

				// Parents
				metasToAdd = f(metas, (m) => {
					return (
						m.checkRelation === true &&
						m.targetType.name === this.getCollectionName()
					)
				})
				metasToReturn.parents = metasToReturn.parents.concat(metasToAdd)
			}
		}

		return metasToReturn
	}
}
