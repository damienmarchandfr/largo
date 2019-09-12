import 'reflect-metadata'

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
		targetType: Function
		targetKey: string
	}>
}

interface CustomGlobal extends NodeJS.Global {
	mongORMFieldMetas: DataStorageFieldMeta
	mongORMIndexMetas: DataStorageIndexMeta
	mongORMRelationsMetas: DataStorageFielRelation
}

export function mongORMetaDataStorage() {
	if (!(global as CustomGlobal).mongORMFieldMetas) {
		;(global as CustomGlobal).mongORMFieldMetas = {}
		;(global as CustomGlobal).mongORMIndexMetas = {}
		;(global as CustomGlobal).mongORMRelationsMetas = {}
	}
	return global as CustomGlobal
}
