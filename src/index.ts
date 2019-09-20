import 'reflect-metadata'
import {
	MongODMValidatorOptionsEnum,
	MongODMValidatorOptionsBson,
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
			[key: string]: MongODMValidatorOptionsBson | MongODMValidatorOptionsEnum
		}
	}
}

interface CustomGlobal extends NodeJS.Global {
	mongODMFieldMetas: DataStorageFieldMeta
	mongODMIndexMetas: DataStorageIndexMeta
	mongODMRelationsMetas: DataStorageFielRelation
	mongODMValidationMetas: DataStorageValidation
}

export function mongODMetaDataStorage() {
	if (!(global as CustomGlobal).mongODMFieldMetas) {
		;(global as CustomGlobal).mongODMFieldMetas = {}
		;(global as CustomGlobal).mongODMIndexMetas = {}
		;(global as CustomGlobal).mongODMRelationsMetas = {}
		;(global as CustomGlobal).mongODMValidationMetas = {}
	}
	return global as CustomGlobal
}
