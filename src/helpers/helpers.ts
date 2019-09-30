import { MongODMEntity } from '../entity/entity'
import { mongODMetaDataStorage } from '..'
import { pick } from 'lodash'

/**
 * Get only the properties with decorators
 * @param obj
 * @param collectionName
 */
export function getMongODMPartial<T extends MongODMEntity>(
	obj: Partial<T>,
	collectionName: string
): Partial<T> {
	// Select fields and indexes
	const fieldKeys =
		mongODMetaDataStorage().mongODMFieldMetas[collectionName] || []

	let indexKeys: string[] = []
	if (mongODMetaDataStorage().mongODMIndexMetas[collectionName]) {
		indexKeys = mongODMetaDataStorage().mongODMIndexMetas[collectionName].map(
			(indexMeta) => {
				return indexMeta.key
			}
		)
	}

	let relationKeys: string[] = []
	if (mongODMetaDataStorage().mongODMRelationsMetas[collectionName]) {
		relationKeys = mongODMetaDataStorage().mongODMRelationsMetas[
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
