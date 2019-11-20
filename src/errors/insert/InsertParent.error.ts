import { LegatoErrorAbstract } from '..'
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

	constructor(
		parent: LegatoEntity,
		relationKey: string,
		meta: DataStorageFielRelationValue
	) {
		const message = `Cannot insert ${parent.getCollectionName()} because it's linked to his child ${
			meta.targetType.name
		} with ${meta.targetKey} = ${(parent as any)[relationKey]}.`
		super(message, 'LEGATO_ERROR_6')

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
		this.childRelationKeyValue = (parent as any)[relationKey]
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
			'child',
		]
		const toReturn: any = {}
		for (const key of errorKey.concat(parentKeys, childKeys)) {
			toReturn[key] = (this as any)[key]
		}
		return toReturn
	}
}
