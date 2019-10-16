import { LegatoErrorRelationOneToManyDelete } from './RelationOneToManyDelete.error'
import { LegatoEntity } from '../entity'
import { ObjectID } from 'mongodb'
import { errorCodes } from '.'

describe('RelationOneToManyDelete error', () => {
	it('should be valid', () => {
		const relationId = new ObjectID()

		class RelationOneToManyDeleteParentClass extends LegatoEntity {
			relations: ObjectID[]

			constructor() {
				super()
				this._id = new ObjectID()
				this.relations = [relationId, new ObjectID()]
			}
		}

		class RelationOneToManyDeleteChildClass extends LegatoEntity {}

		const toDelete = new RelationOneToManyDeleteChildClass()
		toDelete._id = relationId

		const parent = new RelationOneToManyDeleteParentClass()

		const error = new LegatoErrorRelationOneToManyDelete(
			toDelete,
			parent,
			'relations'
		)

		expect(error.code).toEqual(errorCodes.RELATION_ONE_TO_MANY_DELETE)
		expect(error.type).toEqual('RELATION_ONE_TO_MANY_DELETE')

		expect(error.message).toEqual(
			`Cannot delete RelationOneToManyDeleteChildClass with _id : ${toDelete._id}. RelationOneToManyDeleteParentClass with _id : ${parent._id} is linked with RelationOneToManyDeleteParentClass.relations.`
		)
	})
})
