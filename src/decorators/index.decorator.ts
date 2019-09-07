import { mongORMetaDataStorage } from '..'
import { generateCollectionName } from '../connection'

export interface MongORMIndexOptions {
	unique: boolean
}

export function MongORMIndex(options: MongORMIndexOptions) {
	return (object: Object, key: string) => {
		const collectionName = generateCollectionName(object)

		if (!mongORMetaDataStorage().mongORMIndexMetas[collectionName]) {
			mongORMetaDataStorage().mongORMIndexMetas[collectionName] = []
		}

		mongORMetaDataStorage().mongORMIndexMetas[collectionName].push({
			key,
			unique: options.unique,
		})
	}
}
