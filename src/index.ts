import 'reflect-metadata'
import { LegatoEntity } from './entity'
import { LegatoConnection } from './connection'

// Meta field
// User : ['id','email'] for User class with 2 fields saved

// Meta index
// User : [{key : 'id', unique : true},{key : 'email', unique : false}]

// Meta relation
// User : [{ key : companyId ,populatedKey : company, populatedType : User, targetType : Company, targetKey : id}]

type DataStorageFieldMeta = { [key: string]: string[] }
type DataStorageIndexMeta = {
	[key: string]: Array<{ key: string; unique: boolean }>
}
type DataStorageFielRelation = {
	[key: string]: DataStorageFielRelationValue[]
}

export type DataStorageFielRelationValue = {
	key: string
	populatedKey: string
	populatedType: Function // Parent
	targetType: new (...args: any[]) => LegatoEntity // Child
	targetKey: string
	checkRelation: boolean
}

interface CustomGlobal extends NodeJS.Global {
	LegatoFieldMetas: DataStorageFieldMeta
	LegatoIndexMetas: DataStorageIndexMeta
	LegatoRelationsMetas: DataStorageFielRelation
}

export function LegatoMetaDataStorage() {
	if (!((global as unknown) as CustomGlobal).LegatoFieldMetas) {
		;((global as unknown) as CustomGlobal).LegatoFieldMetas = {}
	}
	if (!((global as unknown) as CustomGlobal).LegatoIndexMetas) {
		;((global as unknown) as CustomGlobal).LegatoIndexMetas = {}
	}
	if (!((global as unknown) as CustomGlobal).LegatoRelationsMetas) {
		;((global as unknown) as CustomGlobal).LegatoRelationsMetas = {}
	}

	return (global as unknown) as CustomGlobal
}

let connection: LegatoConnection | null = null

export function getConnection() {
	return connection
}

export function setConnection(connect: LegatoConnection | null) {
	if (connect && !connect.isConnected()) {
		throw new Error('Cannot set connection. Cause not connected.')
	}
	connection = connect
}
