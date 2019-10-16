import { LegatoError, errorMessages } from '.'
import { LegatoEntity } from '../entity'

export class LegatoErrorRelationOneToOneDelete extends LegatoError {
	constructor(toDelete: LegatoEntity, parent: LegatoEntity, parentKey: string) {
		super('RELATION_ONE_TO_ONE_DELETE')
		this.message = errorMessages.RELATION_ONE_TO_ONE_DELETE({
			toDelete,
			parent,
			parentKey,
		})
	}
}
