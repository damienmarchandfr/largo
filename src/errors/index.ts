import { LegatoEntity } from '../entity'

export type errorType =
	| 'NOT_CONNECTED_CANNOT_DISCONNECT'
	| 'NOT_CONNECTED'
	| 'COLLECTION_DOES_NOT_EXIST'
	| 'OBJECT_ALREADY_INSERTED'
	| 'RELATION_ONE_TO_ONE_CREATE'
	| 'RELATION_ONE_TO_ONE_UPDATE'
	| 'RELATION_ONE_TO_ONE_DELETE'
	| 'RELATION_ONE_TO_MANY_CREATE'
	| 'RELATION_ONE_TO_MANY_UPDATE'
	| 'RELATION_ONE_TO_MANY_DELETE'

export const errorCodes: { [key in errorType]: number } = {
	NOT_CONNECTED: 0, // Not connected to database cannot do everything
	NOT_CONNECTED_CANNOT_DISCONNECT: 1, // Cannot call disconnect cause no connection etablished
	COLLECTION_DOES_NOT_EXIST: 3, // Collection not created
	OBJECT_ALREADY_INSERTED: 4, // When object is inserted _id is set and cannot be inserted another time

	// RELATIONS ONE TO ONE
	RELATION_ONE_TO_ONE_CREATE: 5, // When save an object with invalid relation
	RELATION_ONE_TO_ONE_UPDATE: 6, // When change relation value to object not inserted
	RELATION_ONE_TO_ONE_DELETE: 7, // When delete object linked to a parent in one to one

	// RELATION ONE TO MANY
	RELATION_ONE_TO_MANY_CREATE: 8, // When save an object with invalid relation in array
	RELATION_ONE_TO_MANY_UPDATE: 9, // When set an invalid relation in array on update
	RELATION_ONE_TO_MANY_DELETE: 10, // When delete object linked to a parent in one to many
}

export const errorMessages = {
	NOT_CONNECTED: () => {
		return `You are not connected to MongoDB.`
	},
	NOT_CONNECTED_CANNOT_DISCONNECT: () => {
		return `Cannot disconnect cause not connected to MongoDB.`
	},
	COLLECTION_DOES_NOT_EXIST: (collectionName: string) => {
		return `Collection ${collectionName} does not exist.`
	},
	// Insert
	OBJECT_ALREADY_INSERTED: (objectInserted: LegatoEntity) => {
		return `${objectInserted.getCollectionName()} already in database with _id : ${
			objectInserted._id
		}.`
	},
	// RELATION ONE TO ONE
	RELATION_ONE_TO_ONE_CREATE: (args: {
		source: LegatoEntity
		sourceKey: string
	}) => {
		return `You set ${args.source.getCollectionName()}.${args.sourceKey} : ${
			(args.source as any)[args.sourceKey]
		}. This target does not exist.`
	},
	RELATION_ONE_TO_ONE_UPDATE: (args: {
		source: LegatoEntity
		sourceKey: string
	}) => {
		return `You set ${args.source.getCollectionName()}.${args.sourceKey} : ${
			(args.source as any)[args.sourceKey]
		} for object with _id : ${args.source._id}. This target does not exist.`
	},
	// Cannot delete Job with _id : ''. User with _id : '' is linked with User.jobId
	RELATION_ONE_TO_ONE_DELETE: (args: {
		toDelete: LegatoEntity // Job
		parent: LegatoEntity // User
		parentKey: string // jobId
	}) => {
		return `Cannot delete ${args.toDelete.getCollectionName()} with _id : ${
			args.toDelete._id
		}. ${args.parent.getCollectionName()} with _id : ${
			args.parent._id
		} is linked with ${args.parent.getCollectionName()}.${args.parentKey}.`
	},

	// RELATION ONE TO MANY
	// If an id is set in array and not linked to an object on create
	RELATION_ONE_TO_MANY_CREATE: (args: {
		source: LegatoEntity
		sourceKey: string
		sourceKeyValue: any
	}) => {
		return `You set ${args.source.getCollectionName()}.${args.sourceKey} : ${
			(args.source as any)[args.sourceKey]
		}. ${args.sourceKeyValue} does not exist.`
	},
	// If an id is set in array and not linked to an object on update
	RELATION_ONE_TO_MANY_UPDATE: (args: {
		source: LegatoEntity
		sourceKey: string
		sourceKeyValue: any
	}) => {
		return `You set ${args.source.getCollectionName()}.${args.sourceKey} : ${
			(args.source as any)[args.sourceKey]
		} for object with _id : ${args.source._id}.${
			args.sourceKeyValue
		} does not exist.`
	},
	// If an object is linked to a parent and try to delete parent
	RELATION_ONE_TO_MANY_DELETE: (args: {
		toDelete: LegatoEntity // Job
		parent: LegatoEntity // User
		parentKey: string // jobIds[]
	}) => {
		return `Cannot delete ${args.toDelete.getCollectionName()} with _id : ${
			args.toDelete._id
		}. ${args.parent.getCollectionName()} with _id : ${
			args.parent._id
		} is linked with ${args.parent.getCollectionName()}.${args.parentKey}.`
	},
}

export class LegatoError extends Error {
	type: errorType
	code: number

	constructor(type: errorType) {
		super()
		this.type = type
		this.code = errorCodes[this.type]
	}
}
