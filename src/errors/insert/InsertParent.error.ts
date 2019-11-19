import { LegatoErrorAbstract } from '..'
import { LegatoEntity } from '../../entity'
import { DataStorageFielRelationValue } from '../..'

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
		const message = `Cannot insert ${parent.getCollectionName()} because it's linked to his child ${child.getCollectionName()} with ${
			meta.targetKey
		} = ${(child as any)[meta.targetKey]}.`
		super(message, 'LEGATO_ERROR_6')

		// Parent informations
		this.parent = parent.toPlainObj()
		this.parentClass = parent.constructor
		this.parentCollectionName = parent.getCollectionName()
		this.parentRelationKey = meta.key
		this.parentRelationKeyValue = (parent as any)[meta.key]

		// Child information
		this.childClass = child.constructor
		this.childCollectionName = child.getCollectionName()
		this.childRelationKey = meta.targetKey
		this.childRelationKeyValue = (child as any)[meta.targetKey]
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
