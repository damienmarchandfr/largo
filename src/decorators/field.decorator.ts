import { mongODMetaDataStorage } from '..'
import { MongODMEntity } from '../entity/entity'

export function MongODMField<T extends MongODMEntity>() {
	return (object: T, key: string) => {
		const metas = mongODMetaDataStorage().mongODMFieldMetas
		const collectionName = object.getCollectionName()
		if (!metas[collectionName]) {
			metas[collectionName] = []
		}
		metas[collectionName].push(key)
	}
}
