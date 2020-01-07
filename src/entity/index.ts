import {
	FilterQuery,
	UpdateOneOptions,
	ObjectID,
	FindOneOptions,
	UpdateManyOptions,
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
import {
	plainToClass,
	TransformPlainToClass,
	plainToClassFromExist,
} from 'class-transformer'

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
			const object = plainToClass(this, mongoElement)
			results.push(object)
		}

		return results as LegatoEntityArray<T>
	}

	static async findOne<T extends LegatoEntity>(
		filter: FilterQuery<T>,
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
		object._copy = object.toPlainObj()

		return object
	}

	static async updateMany<T extends LegatoEntity>(
		filter: FilterQuery<T> = {},
		partial: Partial<T>,
		checkRelations = true,
		options?: UpdateManyOptions
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

		delete toUpdate._id // MongoID cannot be changed

		if (isEmpty(toUpdate)) {
			return
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
								const obj = new this()
								Object.assign(obj, result)
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
								const obj = new this()
								Object.assign(obj, result)
								throw new LegatoErrorUpdateManyParent(obj, meta)
							}
						}
					}
				}
			}
		}

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
	private _copy: any
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
	}

	beforeInsert<T extends LegatoEntity>() {
		return this.events.beforeInsert as Subject<T>
	}

	afterInsert<T extends LegatoEntity>() {
		return this.events.afterInsert as Subject<T>
	}

	beforeUpdate<T extends LegatoEntity>() {
		return (this.events.beforeUpdate as unknown) as Subject<{
			oldValue: T
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
		delete obj._copy
		delete obj.collectionName
		return obj
	}

	getCopy() {
		// Check if this.copy exsits
		if (!this._copy) {
			this._copy = this.toPlainObj()
		}
		return this._copy
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
			this.collectionName
		].insertOne(toInsert)
		this._id = inserted.insertedId as ObjectID
		this._copy = this.toPlainObj()

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

		if (isEmpty(toUpdate)) {
			return
		}

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

		await connection.collections[this.collectionName].updateOne(
			{ _id: this._id },
			{
				$set: toUpdate,
			},
			options || undefined
		)

		this._copy = {}
		Object.assign(this._copy, this)

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

		if (!this._id) {
			throw new LegatoErrorDeleteNoMongoID(this)
		}

		this.events.beforeDelete.next(this)

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
