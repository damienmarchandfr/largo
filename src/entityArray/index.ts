import { LegatoEntity } from '../entity'
import { LegatoMetaDataStorage, getConnection } from '..'
import { LegatoErrorNotConnected } from '../errors/NotConnected.error'
import { LegatoErrorCollectionDoesNotExist } from '../errors/CollectionDoesNotExist.error'

export class LegatoEntityArray<T extends LegatoEntity> {
	public items: T[] = []

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

	async populate(): Promise<any[]> {
		const connection = getConnection()

		if (!connection) {
			throw new LegatoErrorNotConnected()
		}

		const collectionName = this.items[0].getCollectionName()

		if (!connection.checkCollectionExists(collectionName)) {
			throw new LegatoErrorCollectionDoesNotExist(collectionName)
		}

		const pipeline: object[] = [
			{ $match: { _id: { $in: this.items.map((obj) => obj._id) } } },
		]
		const relationMetas = LegatoMetaDataStorage().LegatoRelationsMetas[
			collectionName
		]

		for (const meta of relationMetas) {
			for (const item of this.items) {
				if ((item as any)[meta.key]) {
					if (!Array.isArray((item as any)[meta.key])) {
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

		return connection.collections[collectionName].aggregate(pipeline).toArray()
	}
}
