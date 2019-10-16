import { LegatoError, errorMessages } from '.'
import { LegatoEntity } from '../entity'

export class LegatoErrorRelationOneToManyDelete extends LegatoError {
	constructor(toDelete: LegatoEntity, parent: LegatoEntity, parentKey: string) {
		super('RELATION_ONE_TO_MANY_DELETE')
		this.message = errorMessages.RELATION_ONE_TO_MANY_DELETE({
			toDelete,
			parent,
			parentKey,
		})
	}
}
