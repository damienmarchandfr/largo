import { errorCodes } from '..'
import { LegatoEntity } from '../../entity'
import { DataStorageFielRelationValue } from '../..'
import { LegatoErrorUpdateParent } from '../update/UpdateParent.error'

export class LegatoErrorUpdateManyParent extends LegatoErrorUpdateParent {
	constructor(parent: LegatoEntity, meta: DataStorageFielRelationValue) {
		const message = `Cannot update ${parent.getCollectionName()} because there is no child ${
			meta.targetType.name
		} with ${meta.targetKey} = ${(parent as any)[meta.key]}.`

		super(parent, meta)
		this.code = errorCodes.updateManyParent
		this.message = message
	}
}
