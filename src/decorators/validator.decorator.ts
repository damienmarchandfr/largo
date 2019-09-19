import { mongORMetaDataStorage } from '..'
import { generateCollectionName } from '../connection'

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

export interface MongORMValidatorOptionsBson {
	bsonType: bsonType
	required?: boolean
	minimum?: number
	maximum?: number
	description?: string
}
export interface MongORMValidatorOptionsEnum {
	enum: string[]
	description?: string
	required?: boolean
}

export function MongORMValidator(
	options: MongORMValidatorOptionsBson | MongORMValidatorOptionsEnum
) {
	return (object: Object, key: string) => {
		const metas = mongORMetaDataStorage().mongORMValidationMetas
		const collectionName = generateCollectionName(object)

		// Set with reference
		if (!metas[collectionName]) {
			metas[collectionName] = {
				required: [],
				properties: {},
			}
		}

		// BSON
		if ((options as MongORMValidatorOptionsBson).bsonType) {
			metas[collectionName].properties[key] = {
				bsonType: (options as MongORMValidatorOptionsBson).bsonType,
				description: options.description || undefined,
			}

			// !== undefined because can equal 0
			if (
				typeof (options as MongORMValidatorOptionsBson).maximum !== 'undefined'
			) {
				;(metas[collectionName].properties[
					key
				] as MongORMValidatorOptionsBson).maximum = (options as MongORMValidatorOptionsBson).maximum
			}

			// !== undefined because can equal 0
			if (
				typeof (options as MongORMValidatorOptionsBson).minimum !== 'undefined'
			) {
				;(metas[collectionName].properties[
					key
				] as MongORMValidatorOptionsBson).minimum = (options as MongORMValidatorOptionsBson).minimum
			}
		}

		// ENUM
		if ((options as MongORMValidatorOptionsEnum).enum) {
			metas[collectionName].properties[key] = {
				enum: (options as MongORMValidatorOptionsEnum).enum,
				description: options.description || undefined,
			}
		}

		if (options.required) {
			metas[collectionName].required.push(key)
		}
	}
}
