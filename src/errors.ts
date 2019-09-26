import format from 'string-template'

import { MongODMEntity } from './entity'

export type errorType =
	| 'NOT_CONNECTED_CANNOT_DISCONNECT'
	| 'NOT_CONNECTED'
	| 'ALREADY_CONNECTED'

const errors = {
	NOT_CONNECTED_CANNOT_DISCONNECT:
		'Mongo client not conected. You cannot disconnect.',
	NOT_CONNECTED: 'You are not connected to a Mongo database.',
	ALREADY_CONNECTED: 'Already connected to Mongo database.',

	COLLECTION_DOES_NOT_EXIST: 'Collection {collectionName} does not exist.',
	DATABASE_NAME_PROTECTED: `Database name '{databaseName}' is protected.`,
	RELATION_ERROR: `You set {sourceKey} : {value} on object {className}. {targetType} with {targetKey} : {relationValue} does not exists.`,
}

// Code to detect error type :)
export type errorCode =
	| 'MONGODM_ERROR_500' // Connection pb
	| 'MONGODM_ERROR_502' // Relation pb
	| 'MONGODM_ERROR_404' // Collection pb
	| 'MONGODM_ERROR_403' // Database protected

// Connection pb
export class MongODMConnectionError extends Error {
	code: errorCode

	constructor(message: errorType) {
		super(errors[message])
		this.code = 'MONGODM_ERROR_500'
	}
}

// When user try to request on a collection not loaded
export class MongODMCollectionDoesNotExistError extends Error {
	code: errorCode

	constructor(collectionName: string) {
		const message = format(errors.COLLECTION_DOES_NOT_EXIST, { collectionName })
		super(message)
		this.code = 'MONGODM_ERROR_404'
	}
}

// When user try to access to protected database
export class MongODMDatabaseNameProtectedError extends Error {
	code: errorCode

	constructor(databaseName: string) {
		const message = format(errors.DATABASE_NAME_PROTECTED, { databaseName })
		super(message)
		this.code = 'MONGODM_ERROR_403'
	}
}

// Relations error
export class MongODMRelationError extends Error {
	code: errorCode

	source: MongODMEntity
	sourceKey: string

	target: MongODMEntity
	targetKey: string

	constructor(
		source: MongODMEntity,
		sourceKey: string,
		target: MongODMEntity,
		targetKey = '_id'
	) {
		const message = format(errors.RELATION_ERROR, {
			sourceKey,
			value: (source as any)[sourceKey],
			className: source.constructor.name,
			targetType: target.constructor.name,
			targetKey,
			relationValue: (source as any)[sourceKey],
		})

		super(message)
		this.source = source
		this.sourceKey = sourceKey

		this.target = target
		this.targetKey = targetKey

		this.code = 'MONGODM_ERROR_502'
	}
}
