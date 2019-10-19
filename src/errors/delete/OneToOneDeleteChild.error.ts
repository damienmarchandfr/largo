import { LegatoEntity } from '../../entity'
import { ObjectID } from 'mongodb'

export class LegatoErrorOneToOneDeleteChild extends Error {
	// Parent linked
	parentCollectionName: string
	parentMongoID: ObjectID | undefined
	parentClass: Function
	parentRelationKey: string
	parentRelationKeyValue: any
	parent: LegatoEntity

	// Child want to delete
	childCollectionName: string
	childMongoID: ObjectID | undefined
	childClass: Function
	childRelationKey: string
	childRelationKeyValue: any
	child: LegatoEntity

	constructor(child: LegatoEntity, parent: LegatoEntity) {
		super()
		this.message = `Cannot delete ${child.getCollectionName()} with _id = ${
			child._id
		} because it's linked to his parent ${parent.getCollectionName()} with _id = ${
			parent._id
		}.`

		// Parent informations
		this.parent = parent.toPlainObj()
		this.parentClass = parent.constructor
		this.parentCollectionName = parent.getCollectionName()
		this.parentMongoID = parent._id
		this.parentRelationKey = '' // TODO
		this.parentRelationKeyValue = '' // TODO

		// Child information
		this.child = child
		this.childClass = child.constructor
		this.childCollectionName = child.getCollectionName()
		this.childMongoID = child._id
		this.childRelationKey = '' // TODO
		this.childRelationKeyValue = '' // TODO
	}
}
