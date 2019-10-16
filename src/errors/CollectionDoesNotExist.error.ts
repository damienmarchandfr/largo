import { LegatoError, errorMessages } from '.'

export class LegatoErrorCollectionDoesNotExist extends LegatoError {
	constructor(collectionName: string) {
		super('COLLECTION_DOES_NOT_EXIST')
		this.message = errorMessages.COLLECTION_DOES_NOT_EXIST(collectionName)
	}
}
