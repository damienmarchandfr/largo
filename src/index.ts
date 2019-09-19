import 'reflect-metadata'
import {
	MongORMValidatorOptionsEnum,
	MongORMValidatorOptionsBson,
} from './decorators/validator.decorator'

// Meta field
// user : ['id','email'] for User class with 2 fields saved

// Meta index
// user : [{key : 'id', unique : true},{key : 'email', unique : false}]

// Meta relation
// user : [{ key : companyId ,populatedKey : company, targetType : Company, targetKey : id}]

// Meta validation
// user : {
//    required : ['keys','required'],
//    properties : { keys : {validation},required : {validation}}
// }

type DataStorageFieldMeta = { [key: string]: string[] }
type DataStorageIndexMeta = {
	[key: string]: Array<{ key: string; unique: boolean }>
}
type DataStorageFielRelation = {
	[key: string]: Array<{
		key: string
		populatedKey: string
		targetType: new (...args: any[]) => any
		targetKey: string
	}>
}

type DataStorageValidation = {
	[key: string]: {
		// Collection name
		required: string[] // Keys required
		properties: {
			[key: string]: MongORMValidatorOptionsBson | MongORMValidatorOptionsEnum
		}
	}
}

interface CustomGlobal extends NodeJS.Global {
	mongORMFieldMetas: DataStorageFieldMeta
	mongORMIndexMetas: DataStorageIndexMeta
	mongORMRelationsMetas: DataStorageFielRelation
	mongORMValidationMetas: DataStorageValidation
}

export function mongORMetaDataStorage() {
	if (!(global as CustomGlobal).mongORMFieldMetas) {
		;(global as CustomGlobal).mongORMFieldMetas = {}
		;(global as CustomGlobal).mongORMIndexMetas = {}
		;(global as CustomGlobal).mongORMRelationsMetas = {}
		;(global as CustomGlobal).mongORMValidationMetas = {}
	}
	return global as CustomGlobal
}
