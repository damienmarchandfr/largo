import { LegatoMetaDataStorage } from '..'
import { LegatoEntity } from '../entity'

export interface LegatoIndexOptions {
	unique: boolean
}

export function LegatoIndex<T extends LegatoEntity>(
	options: LegatoIndexOptions
) {
	return (object: T, key: string) => {
		const collectionName = object.getCollectionName()

		if (!LegatoMetaDataStorage().LegatoIndexMetas[collectionName]) {
			LegatoMetaDataStorage().LegatoIndexMetas[collectionName] = []
		}

		LegatoMetaDataStorage().LegatoIndexMetas[collectionName].push({
			key,
			unique: options.unique,
		})
	}
}
