import { LegatoEntity } from '../../entity'
import { ObjectID } from 'mongodb'
import { DataStorageFielRelationValue } from '../..'

export class LegatoErrorDeleteParent extends Error {
	// Parent want to delete
	parentCollectionName: string
	parentMongoID: ObjectID | undefined
	parentClass: Function
	parentRelationKey: string
	parentRelationKeyValue: any
	parent: LegatoEntity

	// Child linked
	childCollectionName: string
	childMongoID: ObjectID | undefined
	childClass: Function
	childRelationKey: string
	childRelationKeyValue: any
	child: LegatoEntity

	constructor(
		parent: LegatoEntity,
		child: LegatoEntity,
		meta: DataStorageFielRelationValue
	) {
		super()
		this.message = `Cannot delete ${parent.getCollectionName()} with _id = ${
			parent._id
		} because it's linked to his child ${child.getCollectionName()} with _id = ${
			child._id
		}.`

		// Parent informations
		this.parent = parent.toPlainObj()
		this.parentClass = parent.constructor
		this.parentCollectionName = parent.getCollectionName()
		this.parentMongoID = parent._id
		this.parentRelationKey = meta.key
		this.parentRelationKeyValue = (parent as any)[meta.key]

		// Child information
		this.child = child.toPlainObj()
		this.childClass = child.constructor
		this.childCollectionName = child.getCollectionName()
		this.childMongoID = child._id
		this.childRelationKey = meta.targetKey
		this.childRelationKeyValue = (child as any)[meta.targetKey]
	}
}
