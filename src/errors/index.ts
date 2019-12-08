import { LegatoEntity } from '../entity'

export const errorCodes = {
	notConnected: 'LEGATO_ERROR_0',
	cannotDisconnect: 'LEGATO_ERROR_1',
	collectionDoesNotExist: 'LEGATO_ERROR_2',
	objectAlreadyInserted: 'LEGATO_ERROR_3',
	deleteChild: 'LEGATO_ERROR_4',
	deleteNoMongoID: 'LEGATO_ERROR_5',
	insertParent: 'LEGATO_ERROR_6',
	updateParent: 'LEGATO_ERROR_7',
}

export abstract class LegatoErrorAbstract extends Error {
	code: string // Use to know error type when you catch error

	constructor(message: string, code: string) {
		super(message)
		this.code = code
	}
}

export class LegatoErrorNotConnected extends LegatoErrorAbstract {
	constructor() {
		super(`Your are not connected to MongoDB server.`, errorCodes.notConnected)
	}
}

export class LegatoErrorCannotDisconnect extends LegatoErrorAbstract {
	constructor() {
		super(
			`Cannot disconnect. Not connected to MongoDB server.`,
			errorCodes.cannotDisconnect
		)
	}
}

export class LegatoErrorCollectionDoesNotExist extends LegatoErrorAbstract {
	constructor(collectionName: string) {
		super(
			`Cannot find ${collectionName} collection.`,
			errorCodes.collectionDoesNotExist
		)
	}
}

export class LegatoErrorObjectAlreadyInserted extends LegatoErrorAbstract {
	inserted: LegatoEntity

	constructor(inserted: LegatoEntity) {
		super(
			`Object already inserted with _id = ${inserted._id}.`,
			errorCodes.objectAlreadyInserted
		)
		this.inserted = inserted
	}
}
