import { MongODMEntity } from '../entity/entity'
import { MongODMConnection } from '../connection/connection'
import { MongODMCollectionDoesNotExistError } from '../errors/errors'
import { mongODMetaDataStorage } from '..'

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

	async populate<T extends MongODMEntity>(connect: MongODMConnection) {
		const collectionName = this.items[0].getCollectionName()

		if (!connect.checkCollectionExists(collectionName)) {
			throw new MongODMCollectionDoesNotExistError(collectionName)
		}

		const pipeline: object[] = [
			{ $match: { _id: { $in: this.items.map((obj) => obj._id) } } },
		]
		const relationMetas = mongODMetaDataStorage().mongODMRelationsMetas[
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

		return connect.collections[collectionName]
			.aggregate(pipeline)
			.toArray() as Promise<T[]>
	}
}
