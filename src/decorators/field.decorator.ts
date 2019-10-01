import { LegatoMetaDataStorage } from '..'
import { LegatoEntity } from '../entity'

export function LegatoField<T extends LegatoEntity>() {
	return (object: T, key: string) => {
		const metas = LegatoMetaDataStorage().LegatoFieldMetas
		const collectionName = object.getCollectionName()
		if (!metas[collectionName]) {
			metas[collectionName] = []
		}
		metas[collectionName].push(key)
	}
}
