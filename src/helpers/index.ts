import { LegatoEntity } from '../entity'
import { LegatoMetaDataStorage } from '..'
import { pick } from 'lodash'

/**
 * Get only the properties with decorators
 * @param obj
 * @param collectionName
 */
export function getLegatoPartial<T extends LegatoEntity>(
	obj: Partial<T>,
	collectionName: string
): Partial<T> {
	// Select fields and indexes
	const fieldKeys =
		LegatoMetaDataStorage().LegatoFieldMetas[collectionName] || []

	let indexKeys: string[] = []
	if (LegatoMetaDataStorage().LegatoIndexMetas[collectionName]) {
		indexKeys = LegatoMetaDataStorage().LegatoIndexMetas[collectionName].map(
			(indexMeta) => {
				return indexMeta.key
			}
		)
	}

	let relationKeys: string[] = []
	if (LegatoMetaDataStorage().LegatoRelationsMetas[collectionName]) {
		relationKeys = LegatoMetaDataStorage().LegatoRelationsMetas[
			collectionName
		].map((relationMeta) => {
			return relationMeta.key
		})
	}

	return pick(
		obj,
		fieldKeys // Fields
			.concat(indexKeys) // Index
			.concat(relationKeys) // Relation
	)
}
