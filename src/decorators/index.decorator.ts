import { mongODMetaDataStorage } from '..'
import { MongODMEntity } from '../entity'

export interface MongODMIndexOptions {
	unique: boolean
}

export function MongODMIndex<T extends MongODMEntity>(
	options: MongODMIndexOptions
) {
	return (object: T, key: string) => {
		const collectionName = object.getCollectionName()

		if (!mongODMetaDataStorage().mongODMIndexMetas[collectionName]) {
			mongODMetaDataStorage().mongODMIndexMetas[collectionName] = []
		}

		mongODMetaDataStorage().mongODMIndexMetas[collectionName].push({
			key,
			unique: options.unique,
		})
	}
}
