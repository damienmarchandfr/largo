import { LegatoEntity } from '../entity'

export abstract class LegatoErrorAbstract extends Error {
	code: string // Use to know error type when you catch error

	constructor(message: string, code: string) {
		super(message)
		this.code = code
	}
}

export class LegatoErrorNotConnected extends LegatoErrorAbstract {
	constructor() {
		super(`Your are not connected to MongoDB server.`, 'LEGATO_ERROR_0')
	}
}

export class LegatoErrorCannotDisconnect extends LegatoErrorAbstract {
	constructor() {
		super(
			`Cannot disconnect. Not connected to MongoDB server.`,
			'LEGATO_ERROR_1'
		)
	}
}

export class LegatoErrorCollectionDoesNotExist extends LegatoErrorAbstract {
	constructor(collectionName: string) {
		super(`Cannot find ${collectionName} collection.`, 'LEGATO_ERROR_2')
	}
}

export class LegatoErrorObjectAlreadyInserted extends LegatoErrorAbstract {
	inserted: LegatoEntity

	constructor(inserted: LegatoEntity) {
		super(
			`Object already inserted with _id = ${inserted._id}.`,
			'LEGATO_ERROR_3'
		)
		this.inserted = inserted
	}
}
