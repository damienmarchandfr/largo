import { LegatoError, errorMessages } from '.'
import { LegatoEntity } from '../entity'

export class LegatoErrorObjectAlreadyInserted extends LegatoError {
	constructor(insertedObject: LegatoEntity) {
		super('OBJECT_ALREADY_INSERTED')
		this.message = errorMessages.OBJECT_ALREADY_INSERTED(insertedObject)
	}
}
