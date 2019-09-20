import { mongODMetaDataStorage } from '..'

export function MongODMField() {
	return (object: Object, key: string) => {
		const metas = mongODMetaDataStorage().mongODMFieldMetas
		const collectionName = (object as any).getCollectionName()
		if (!metas[collectionName]) {
			metas[collectionName] = []
		}
		metas[collectionName].push(key)
	}
}
