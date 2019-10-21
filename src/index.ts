import 'reflect-metadata'
import { LegatoEntity } from './entity'
import { LegatoConnection } from './connection'

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
		targetType: new (...args: any[]) => LegatoEntity
		targetKey: string
		checkRelation: boolean
	}>
}

interface CustomGlobal extends NodeJS.Global {
	LegatoFieldMetas: DataStorageFieldMeta
	LegatoIndexMetas: DataStorageIndexMeta
	LegatoRelationsMetas: DataStorageFielRelation
}

export function LegatoMetaDataStorage() {
	if (!(global as CustomGlobal).LegatoFieldMetas) {
		;(global as CustomGlobal).LegatoFieldMetas = {}
	}
	if (!(global as CustomGlobal).LegatoIndexMetas) {
		;(global as CustomGlobal).LegatoIndexMetas = {}
	}
	if (!(global as CustomGlobal).LegatoRelationsMetas) {
		;(global as CustomGlobal).LegatoRelationsMetas = {}
	}

	return global as CustomGlobal
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
