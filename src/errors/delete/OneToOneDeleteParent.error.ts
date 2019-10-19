import { LegatoEntity } from '../../entity'
import { ObjectID } from 'mongodb'

export class LegatoErrorOneToOneDeleteParent extends Error {
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

	constructor(parent: LegatoEntity, child: LegatoEntity) {
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
		this.parentRelationKey = '' // TODO
		this.parentRelationKeyValue = '' // TODO

		// Child information
		this.child = child.toPlainObj()
		this.childClass = child.constructor
		this.childCollectionName = child.getCollectionName()
		this.childMongoID = child._id
		this.childRelationKey = '' // TODO
		this.childRelationKeyValue = '' // TODO
	}
}
