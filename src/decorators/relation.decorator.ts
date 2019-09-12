import { mongORMetaDataStorage } from '..'
import { generateCollectionName } from '../connection'

export interface MongORMRelationOptions {
	populatedKey: string // userId -> user
	targetType: Function // User
	targetKey?: string // _id
}

export function MongORMRelation(options: MongORMRelationOptions) {
	return (object: Object, key: string) => {
		const metas = mongORMetaDataStorage().mongORMRelationsMetas
		const collectionName = generateCollectionName(object)
		if (!metas[collectionName]) {
			metas[collectionName] = []
		}
		metas[collectionName].push({
			key,
			populatedKey: options.populatedKey,
			targetKey: options.targetKey || '_id',
			targetType: options.targetType,
		})
	}
}
