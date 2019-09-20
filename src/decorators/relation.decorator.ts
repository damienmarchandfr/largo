import { mongODMetaDataStorage } from '..'

export interface MongODMRelationOptions {
	populatedKey: string // userId -> user
	targetType: new (...args: any[]) => any // User
	targetKey?: string // _id
}

export function MongODMRelation(options: MongODMRelationOptions) {
	return (object: Object, key: string) => {
		const metas = mongODMetaDataStorage().mongODMRelationsMetas
		const collectionName = (object as any).getCollectionName()
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
