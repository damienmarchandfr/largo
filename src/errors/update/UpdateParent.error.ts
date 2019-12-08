import { LegatoErrorAbstract, errorCodes } from '..'
import { LegatoEntity } from '../../entity'
import { DataStorageFielRelationValue } from '../..'

/**
 * When update parent and relations are not valid
 */
export class LegatoErrorUpdateParent extends LegatoErrorAbstract {
	// Parent want to update
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
		const message = `Cannot update ${parent.getCollectionName()} because there is no child ${
			meta.targetType.name
		} with ${meta.targetKey} = ${(parent as any)[meta.key]}.`
		super(message, errorCodes.updateParent)

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

	toPlainObj() {
		const errorKey = ['message']
		const parentKeys = [
			'parentCollectionName',
			'parentClass',
			'parentRelationKey',
			'parentRelationKeyValue',
			'parent',
		]
		const childKeys = [
			'childCollectionName',
			'childClass',
			'childRelationKey',
			'childRelationKeyValue',
		]
		const toReturn: any = {}
		for (const key of errorKey.concat(parentKeys, childKeys)) {
			toReturn[key] = (this as any)[key]
		}
		return toReturn
	}
}
