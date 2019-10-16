import { LegatoError, errorMessages } from '.'
import { LegatoEntity } from '../entity'

export class LegatoErrorRelationOneToOneUpdate extends LegatoError {
	constructor(source: LegatoEntity, sourceKey: string) {
		super('RELATION_ONE_TO_ONE_UPDATE')
		this.message = errorMessages.RELATION_ONE_TO_ONE_UPDATE({
			source,
			sourceKey,
		})
	}
}
