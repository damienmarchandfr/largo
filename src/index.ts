import 'reflect-metadata'

// Meta field
// user : ['id','email'] for User class with 2 fields saved

// Meta index
// user : [{key : 'id', unique : true},{key : 'email', unique : false}]

type DataStorageFieldMeta = { [key: string]: string[] }
type DataStorageIndexMeta = {
	[key: string]: Array<{ key: string; unique: boolean }>
}

interface CustomGlobal extends NodeJS.Global {
	mongORMFieldMetas: DataStorageFieldMeta
	mongORMIndexMetas: DataStorageIndexMeta
}

export function mongORMetaDataStorage() {
	if (!(global as CustomGlobal).mongORMFieldMetas) {
		;(global as CustomGlobal).mongORMFieldMetas = {}
		;(global as CustomGlobal).mongORMIndexMetas = {}
	}
	return global as CustomGlobal
}
