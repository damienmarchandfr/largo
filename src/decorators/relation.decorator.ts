import { LegatoMetaDataStorage } from '..'
import { LegatoEntity } from '../entity'

interface LegatoRelationOptions {
	populatedKey: string // userId -> user
	targetType: new (...args: any[]) => LegatoEntity // User
	targetKey?: string // _id
	checkRelation?: boolean
}

export function LegatoRelation<T extends LegatoEntity>(
	options: LegatoRelationOptions
) {
	return (object: T, key: string) => {
		const metas = LegatoMetaDataStorage().LegatoRelationsMetas
		const collectionName = object.getCollectionName()

		/* istanbul ignore next */
		if (!metas[collectionName]) {
			metas[collectionName] = []
		}

		metas[collectionName].push({
			key,
			populatedKey: options.populatedKey,
			populatedType: object.constructor,
			targetKey: options.targetKey || '_id',
			targetType: options.targetType,
			checkRelation:
				typeof options.checkRelation === 'undefined'
					? true
					: options.checkRelation,
		})
	}
}
