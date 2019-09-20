import { mongODMetaDataStorage } from '..'

// https://docs.mongodb.com/manual/reference/operator/query/type/#document-type-available-types
type simpleBsonType =
	| 'double'
	| 'string'
	| 'object'
	| 'array'
	| 'binData'
	| 'objectId'
	| 'bool'
	| 'date'
	| 'null'
	| 'regex'
	| 'javascript'
	| 'javascriptWithScope'
	| 'int'
	| 'timestamp'
	| 'long'
	| 'decimal'
	| 'minKey'
	| 'maxKey'

type bsonType = simpleBsonType | simpleBsonType[]

export interface MongODMValidatorOptionsBson {
	bsonType: bsonType
	required?: boolean
	minimum?: number
	maximum?: number
	description?: string
}
export interface MongODMValidatorOptionsEnum {
	enum: string[]
	description?: string
	required?: boolean
}

export function MongODMValidator(
	options: MongODMValidatorOptionsBson | MongODMValidatorOptionsEnum
) {
	return (object: Object, key: string) => {
		const metas = mongODMetaDataStorage().mongODMValidationMetas
		const collectionName = (object as any).getCollectionName()

		// Set with reference
		if (!metas[collectionName]) {
			metas[collectionName] = {
				required: [],
				properties: {},
			}
		}

		// BSON
		if ((options as MongODMValidatorOptionsBson).bsonType) {
			metas[collectionName].properties[key] = {
				bsonType: (options as MongODMValidatorOptionsBson).bsonType,
				description: options.description || undefined,
			}

			// !== undefined because can equal 0
			if (
				typeof (options as MongODMValidatorOptionsBson).maximum !== 'undefined'
			) {
				;(metas[collectionName].properties[
					key
				] as MongODMValidatorOptionsBson).maximum = (options as MongODMValidatorOptionsBson).maximum
			}

			// !== undefined because can equal 0
			if (
				typeof (options as MongODMValidatorOptionsBson).minimum !== 'undefined'
			) {
				;(metas[collectionName].properties[
					key
				] as MongODMValidatorOptionsBson).minimum = (options as MongODMValidatorOptionsBson).minimum
			}
		}

		// ENUM
		if ((options as MongODMValidatorOptionsEnum).enum) {
			metas[collectionName].properties[key] = {
				enum: (options as MongODMValidatorOptionsEnum).enum,
				description: options.description || undefined,
			}
		}

		if (options.required) {
			metas[collectionName].required.push(key)
		}
	}
}
