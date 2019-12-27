import { LegatoErrorAbstract, errorCodes } from '..'
import { LegatoEntity } from '../../entity'
import { DataStorageFielRelationValue } from '../..'

/**
 * When insert parent and relations are not valid
 */
export class LegatoErrorInsertParent extends LegatoErrorAbstract {
	// Parent want to insert
	parentCollectionName: string
	parentClass: Function
	parentRelationKey: string
	parentRelationKeyValue: any
	parent: LegatoEntity

	// Child linked
	childCollectionName: string
	childClass: Function
	childRelationKey: string
	childRelationKeyValue: any

	constructor(parent: LegatoEntity, meta: DataStorageFielRelationValue) {
		const message = `Cannot insert ${parent.getCollectionName()} because it's linked to an unknown child ${
			meta.targetType.name
		} with ${meta.targetKey} = ${(parent as any)[meta.key]}.`
		super(message, errorCodes.insertParent)

		// Parent informations
		this.parent = parent.toPlainObj()
		this.parentClass = parent.constructor
		this.parentCollectionName = parent.getCollectionName()
		this.parentRelationKey = meta.key
		this.parentRelationKeyValue = (parent as any)[meta.key]

		// Child information
		this.childClass = meta.targetType
		this.childCollectionName = meta.targetType.name
		this.childRelationKey = meta.targetKey
		this.childRelationKeyValue = (parent as any)[meta.key]
	}
}
