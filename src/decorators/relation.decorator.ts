import { mongODMetaDataStorage } from '..'
import { MongODMEntity } from '../entity/entity'

interface MongODMRelationOptions {
	populatedKey: string // userId -> user
	targetType: new (...args: any[]) => MongODMEntity // User
	targetKey?: string // _id
}

export function MongODMRelation<T extends MongODMEntity>(
	options: MongODMRelationOptions
) {
	return (object: T, key: string) => {
		const metas = mongODMetaDataStorage().mongODMRelationsMetas
		const collectionName = object.getCollectionName()
		/* istanbul ignore next */
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
