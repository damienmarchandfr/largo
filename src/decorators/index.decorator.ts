import { mongODMetaDataStorage } from '..'

export interface MongODMIndexOptions {
	unique: boolean
}

export function MongODMIndex(options: MongODMIndexOptions) {
	return (object: Object, key: string) => {
		const collectionName = (object as any).getCollectionName()

		if (!mongODMetaDataStorage().mongODMIndexMetas[collectionName]) {
			mongODMetaDataStorage().mongODMIndexMetas[collectionName] = []
		}

		mongODMetaDataStorage().mongODMIndexMetas[collectionName].push({
			key,
			unique: options.unique,
		})
	}
}
