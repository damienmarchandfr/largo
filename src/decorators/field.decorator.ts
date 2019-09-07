import { mongORMetaDataStorage } from '..'
import { generateCollectionName } from '../connection'

export function MongORMField() {
	return (object: Object, key: string) => {
		const metas = mongORMetaDataStorage().mongORMFieldMetas
		const collectionName = generateCollectionName(object)
		if (!metas[collectionName]) {
			metas[collectionName] = []
		}
		metas[collectionName].push(key)
	}
}
