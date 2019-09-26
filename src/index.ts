import 'reflect-metadata'
import { MongODMEntity } from './entity'

// Meta field
// user : ['id','email'] for User class with 2 fields saved

// Meta index
// user : [{key : 'id', unique : true},{key : 'email', unique : false}]

// Meta relation
// user : [{ key : companyId ,populatedKey : company, targetType : Company, targetKey : id}]

type DataStorageFieldMeta = { [key: string]: string[] }
type DataStorageIndexMeta = {
	[key: string]: Array<{ key: string; unique: boolean }>
}
type DataStorageFielRelation = {
	[key: string]: Array<{
		key: string
		populatedKey: string
		targetType: new (...args: any[]) => MongODMEntity
		targetKey: string
	}>
}

interface CustomGlobal extends NodeJS.Global {
	mongODMFieldMetas: DataStorageFieldMeta
	mongODMIndexMetas: DataStorageIndexMeta
	mongODMRelationsMetas: DataStorageFielRelation
}

export function mongODMetaDataStorage() {
	if (!(global as CustomGlobal).mongODMFieldMetas) {
		;(global as CustomGlobal).mongODMFieldMetas = {}
		;(global as CustomGlobal).mongODMIndexMetas = {}
		;(global as CustomGlobal).mongODMRelationsMetas = {}
	}
	return global as CustomGlobal
}
